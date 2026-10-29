import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import {StyleSheet, View, TouchableOpacity, Image, Dimensions, Text, TextInput, TouchableWithoutFeedback, Keyboard, Modal, ActivityIndicator, Linking, Alert, Animated, ScrollView, Platform} from 'react-native';
import MapView, {PROVIDER_GOOGLE, Marker} from 'react-native-maps';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faLocationCrosshairs, faShareFromSquare } from '@fortawesome/free-solid-svg-icons';
import { MyText } from '../components/MyText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../views/config';
import * as Location from 'expo-location';
import { useFonts } from 'expo-font';
import moment from 'moment';
import { debounce } from 'lodash';
import NavigationContext from '../context/NavigationContext';
import { useChat } from '../context/ChatContext';
import { supabase } from '../lib/supabase'; // adjust path as needed
import { shareListingFromToken } from '../utils/classShare';
import manhattanStudios from '../data/manhattanStudios.json';

const studioMarkers = manhattanStudios.map((studio) => ({
  _id: String(studio.id),
  name: studio.name,
  address: studio.address,
  latitude: studio.latitude,
  longitude: studio.longitude,
  website: studio.website || '',
}));

const { width, height } = Dimensions.get('window');
/**
 * Custom marker size — **iOS only** (scaled `Image` + padding).
 * **Android** uses native `Marker` `image` (full bitmap, no RN view snapshot) so pins are not clipped to a “top-left sliver”.
 *
 * Snapshot padding (iOS): `MAP_PIN_SNAPSHOT_GUARD` on top + sides; `MAP_PIN_SNAPSHOT_BOTTOM_EXTRA` under the icon for the tip.
 */
const MAP_PIN_SNAPSHOT_GUARD = 8;
const MAP_PIN_SNAPSHOT_BOTTOM_EXTRA = 14;
/** Reference scale × (1 + 2/3) = two-thirds bigger than the previous 0.58 baseline. */
const MAP_PIN_VISUAL_SCALE = (0.58 * 5) / 3;
const MAP_PIN_SIZE_MULT = 1.09 * MAP_PIN_VISUAL_SCALE;
const MAP_PIN_ICON = Math.round(34 * (4 / 3) * MAP_PIN_SIZE_MULT);
const MAP_PIN_HIT = Math.round(44 * (4 / 3) * MAP_PIN_SIZE_MULT);
const MAP_PIN_CLIP_PAD_TOP =
  Math.max(6, Math.round(8 * MAP_PIN_VISUAL_SCALE)) + MAP_PIN_SNAPSHOT_GUARD;
const MAP_PIN_CLIP_PAD_BOTTOM =
  Math.max(10, Math.round(14 * MAP_PIN_VISUAL_SCALE)) +
  MAP_PIN_SNAPSHOT_GUARD +
  MAP_PIN_SNAPSHOT_BOTTOM_EXTRA;
const MAP_PIN_CLIP_PAD_H =
  Math.max(6, Math.round(8 * MAP_PIN_VISUAL_SCALE)) + MAP_PIN_SNAPSHOT_GUARD;
const MAP_PIN_MARKER_H =
  MAP_PIN_CLIP_PAD_TOP + MAP_PIN_ICON + MAP_PIN_CLIP_PAD_BOTTOM;
const MAP_PIN_MARKER_W = MAP_PIN_HIT + MAP_PIN_CLIP_PAD_H * 2;
const MAP_PIN_ANCHOR_Y = (MAP_PIN_CLIP_PAD_TOP + MAP_PIN_ICON) / MAP_PIN_MARKER_H;
/** Total width of overlay row (callout body + optional share rail). */
const MAP_CALLOUT_WIDTH = Math.min(244, width - 32);
const MAP_CALLOUT_SHARE_RAIL = 40;
const MAP_CALLOUT_ABOVE_PIN = 250;
const MAP_CALLOUT_NUDGE_X = 10;
const MAP_CALLOUT_NUDGE_Y = 10;
/** Fine-tune if pin art sits off the geographic anchor (positive = nudge arrow right). */
const MAP_CALLOUT_ARROW_PIN_OFFSET_X = 0;
const CALLOUT_PINK_BORDER = 6;
const MAP_CALLOUT_ARROW_W = 34;
const MAP_CALLOUT_ARROW_H = 17;
const MAP_CALLOUT_ARROW_OUTER_HALF = 16;
const MAP_CALLOUT_ARROW_OUTER_TOP = 18;
const MAP_CALLOUT_ARROW_INNER_HALF = MAP_CALLOUT_ARROW_OUTER_HALF - CALLOUT_PINK_BORDER;
const MAP_CALLOUT_ARROW_INNER_TOP = MAP_CALLOUT_ARROW_OUTER_TOP - CALLOUT_PINK_BORDER;
const MAP_CALLOUT_ARROW_OUTER_BASE = MAP_CALLOUT_ARROW_OUTER_HALF * 2;
const MAP_CALLOUT_ARROW_INNER_BASE = MAP_CALLOUT_ARROW_INNER_HALF * 2;
/**
 * After selecting a pin, shift the map center slightly north (as a fraction of visible latitude span)
 * so the pin sits a little below the middle of the map — leaves room for the overlay callout above the pin.
 */
const MAP_PIN_FOCUS_LAT_BIAS = 0.1;

/** Fallback center (continental US) when GPS is unavailable or times out. */
const DEFAULT_MAP_CENTER = { latitude: 39.8283, longitude: -98.5795 };
const MAP_REGION_DELTA = 0.05;
const MAP_LOCATION_TIMEOUT_MS = 12000;

const resolveMapCoordinates = async () => {
  try {
    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: 10 * 60 * 1000,
      requiredAccuracy: 1000,
    });
    if (lastKnown?.coords) {
      const { latitude, longitude } = lastKnown.coords;
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return { latitude, longitude };
      }
    }
  } catch (_) {
    /* try current position next */
  }

  try {
    const location = await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Location request timed out')),
          MAP_LOCATION_TIMEOUT_MS
        )
      ),
    ]);
    const { latitude, longitude } = location.coords;
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude };
    }
  } catch (err) {
    console.warn(
      'Could not get current position, using default map center:',
      err?.message ?? err
    );
  }

  return { ...DEFAULT_MAP_CENTER };
};

const MAP_ICON_MEMBERSHIP = require('../img/ym-mapicon-purple.png');
const MAP_ICON_RETREAT = require('../img/ym-mapicon-green.png');
const MAP_ICON_CLASS = require('../img/ym-mapicon-pink.png');

const MAP_PIN_MARKER_STYLES = StyleSheet.create({
  mapPinMarkerHit: {
    width: MAP_PIN_MARKER_W,
    height: MAP_PIN_MARKER_H,
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  mapPinMarkerTopPad: {
    height: MAP_PIN_CLIP_PAD_TOP,
    width: MAP_PIN_MARKER_W,
  },
  mapPinMarkerBottomPad: {
    height: MAP_PIN_CLIP_PAD_BOTTOM,
    width: MAP_PIN_MARKER_W,
  },
  mapPinMarkerIcon: {
    width: MAP_PIN_ICON,
    height: MAP_PIN_ICON,
  },
});

/**
 * iOS custom markers are bitmap snapshots of child views. With tracksViewChanges=false
 * before the pin image paints, the snapshot is blank but the native hit target remains.
 */
const MapPinMarker = ({ marker, iconSource, onPress }) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const stopTrackingRef = useRef(false);

  const stopTracking = useCallback(() => {
    if (stopTrackingRef.current) return;
    stopTrackingRef.current = true;
    requestAnimationFrame(() => {
      setTimeout(() => setTracksViewChanges(false), 64);
    });
  }, []);

  useEffect(() => {
    stopTrackingRef.current = false;
    setTracksViewChanges(true);
    const fallback = setTimeout(stopTracking, 1500);
    return () => clearTimeout(fallback);
  }, [marker._id, iconSource, stopTracking]);

  const coord = {
    latitude: parseFloat(marker.latitude),
    longitude: parseFloat(marker.longitude),
  };

  return (
    <Marker
      key={marker._id}
      identifier={String(marker._id)}
      coordinate={coord}
      anchor={{ x: 0.5, y: MAP_PIN_ANCHOR_Y }}
      tracksViewChanges={tracksViewChanges}
      onPress={onPress}
    >
      <View style={MAP_PIN_MARKER_STYLES.mapPinMarkerHit} collapsable={false}>
        <View style={MAP_PIN_MARKER_STYLES.mapPinMarkerTopPad} collapsable={false} />
        <Image
          style={MAP_PIN_MARKER_STYLES.mapPinMarkerIcon}
          source={iconSource}
          resizeMode="contain"
          fadeDuration={0}
          onLoad={stopTracking}
          onLoadEnd={stopTracking}
        />
        <View style={MAP_PIN_MARKER_STYLES.mapPinMarkerBottomPad} collapsable={false} />
      </View>
    </Marker>
  );
};

export default function Map({ navigation }) {

  const roundedWidth = Math.round(width);
  const roundedHeight = Math.round(height);

  const [region, setRegion] = useState(null);

  const [staticMapUrl, setStaticMapUrl] = useState('');
  const zoom = 12; // Adjust the zoom level
  const [isBookingsModalVisible, setIsBookingsModalVisible] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState('');
  const { setChatRecipient, setMySupabaseId, setShowChat, setHasBooking } = useChat();

  const syncMySupabaseIdFromUser = (userRecord) => {
    if (!userRecord?.supabaseId) return false;
    setMySupabaseId({
      id: userRecord.supabaseId,
      name:
        `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim() ||
        'You',
    });
    return true;
  };

  const fetchUserBookings = async () => {
    try {
      setBookingsLoading(true);
      
      const user = await AsyncStorage.getItem('user');
      const userData = JSON.parse(user);
      console.log('user data to get bookings', userData)
      if (!userData || !userData._id) {
        setBookingsError('User data not found. Please log in again.');
        setHasBooking(false);
        return [];
      }

      syncMySupabaseIdFromUser(userData);

      // Fetch bookings for the user
      const response = await fetch(`${config.apiUrl}/bookings?userId=${userData._id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const bookingsDataRaw = await response.json();
      const bookingsData = Array.isArray(bookingsDataRaw) ? bookingsDataRaw : [];

      // Fetch all classes to match with bookings
      const classesResponse = await fetch(`${config.apiUrl}/classes`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const classesData = await classesResponse.json();

      // Filter bookings for current and future classes
      const today = moment().startOf('day');
      const filteredBookings = await Promise.all(
        bookingsData.map(async (booking) => {
          // Find the class with matching classId
          const matchingClass = classesData.find((classItem) => classItem._id === booking.classId);
          console.log('matching pass', matchingClass);
          if (matchingClass) {
            const classDateTime = moment(matchingClass.date + ' ' + matchingClass.time, 'MMMM DD, YYYY h:mm A');
            if (classDateTime.isSameOrAfter(today)) {
              return booking;
            }
          }
          console.log('filtered bookings', filteredBookings)
          return null;
        })
      );

      // Remove null entries and fetch provider details
      const validBookings = filteredBookings.filter((booking) => booking !== null);
      console.log('valid bookings', validBookings)
      const bookingsWithProviderDetails = await Promise.all(
        validBookings.map(async (booking) => {
          // Find the class again to get providerId
          const matchingClass = classesData.find((classItem) => classItem._id === booking.classId);
          if (!matchingClass || !matchingClass.providerId) {
            console.warn(`No matching pass or providerId for booking ${booking._id}`);
            return {
              ...booking,
              studioName: 'Unknown Provider',
              providerSupabaseId: null,
              className: 'Unknown Pass',
              classDate: 'Unknown Date',
            };
          }
          const providerResponse = await fetch(`${config.apiUrl}/providers/get-provider/${matchingClass.providerId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          const providerData = await providerResponse.json();
          return {
            ...booking,
            providerId: matchingClass.providerId,
            studioName: (providerData.resortName || providerData.studioName) || providerData.name || 'Unknown Provider',
            providerSupabaseId: providerData.supabaseId,
            className: matchingClass.name || 'Unknown Pass',
            classDate: matchingClass.date || 'Unknown Date',
          };
        })
      );
      console.log('bookings with provider details', bookingsWithProviderDetails);
      setBookings(bookingsWithProviderDetails);
      setHasBooking(bookingsWithProviderDetails.length > 0);
      return bookingsWithProviderDetails;
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setBookingsError('Failed to load bookings. Please try again.');
      setHasBooking(false);
      return [];
    } finally {
      setBookingsLoading(false);
    }
  };

    const checkBookings = async () => {
      if (!userLoggedIn) {
          setIsBookingsModalVisible(false);
          return;
        }
      await fetchUserBookings();
    };

    useEffect(() => {
      const unsubscribe = navigation.addListener('focus', () => {
        if (userLoggedIn) {
          console.log('Map page focused, refreshing bookings');
          checkBookings();
        }
      });

      return unsubscribe;
    }, [navigation, userLoggedIn]);

    const getProviderSupabaseId = async (providerId) => {
      try {
        const response = await fetch(`${config.apiUrl}/providers/get-by-id`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ providerId }),
        });
        const providerData = await response.json();
        if (response.ok && providerData?.supabaseId) {
          return providerData.supabaseId;
        }
        return null;
      } catch (error) {
        console.error('Error fetching provider Supabase ID:', error);
        return null;
      }
    };

    const handleChat = async (booking) => {
      setIsBookingsModalVisible(false);
      if (!booking) return;

      const { providerId, studioName, providerSupabaseId: cachedSupabaseId } =
        booking;

      try {
        const userRaw = await AsyncStorage.getItem('user');
        const parsedUser = userRaw ? JSON.parse(userRaw) : null;
        if (!syncMySupabaseIdFromUser(parsedUser)) {
          Alert.alert(
            'Error',
            'Unable to start chat: Your account is not set up for messaging.'
          );
          return;
        }

        let providerSupabaseId = cachedSupabaseId;
        if (!providerSupabaseId && providerId) {
          providerSupabaseId = await getProviderSupabaseId(providerId);
        }
        if (!providerSupabaseId) {
          Alert.alert(
            'Error',
            'Unable to start chat: Provider information missing.'
          );
          return;
        }

        setHasBooking(true);
        setChatRecipient({
          id: providerSupabaseId,
          name: studioName || 'Provider',
        });
        setShowChat(true);
      } catch (error) {
        console.error('Error handling chat:', error);
        Alert.alert('Error', 'Failed to start chat. Please try again.');
      }
    };

    const fetchClassId = async (classToken) => {
      console.log('pass token', classToken)
      try {
        const response = await fetch(`${config.apiUrl}/classes/get-class/${classToken}`);
        const data = await response.json();
        if (response.ok) {
          return { kind: 'Class', data };
        }
        const membershipResp = await fetch(
          `${config.apiUrl}/memberships/get-membership/${classToken}`
        );
        const membershipData = await membershipResp.json();
        if (membershipResp.ok) {
          return { kind: 'Membership', data: membershipData };
        }
        console.error('Error fetching listing by token:', data.message);
        return null;
      } catch (error) {
        console.error('Error fetching listing by token:', error);
        return null;
      }
    };

    const handleDeepLink = async (event) => {
      const { url } = event;
      const route = url.replace(/.*?:\/\//g, '');
      const [prefix, path, rawToken] = route.split('/');
      const classToken = rawToken
        ? String(rawToken).split(/[?#]/)[0]
        : '';
      console.log('prefix', prefix)
      console.log('path', path)
      console.log('classToken', classToken)
      const pathOk =
        path &&
        path.toLowerCase() === 'classdescription';
      if (prefix === 'main' && pathOk && classToken) {
          const listing = await fetchClassId(classToken);
        if (listing?.data) {
        const details = listing.data;
        if (listing.kind === 'Membership') {
          navigation.navigate('ClassDescription', {
            key: Math.random().toString(),
            classId: details._id,
            name: details.name,
            type: details.type,
            description: details.description,
            studioName: (details.resortName || details.studioName),
            address: details.address,
            address2: details.address2,
            cityState: details.cityState,
            zipcode: details.zipcode,
            price: details.price,
            currency: details.currency,
            providerId: details.providerId,
            profileImage: details.profileImage,
            duration: details.duration,
            token: details.token,
            clickedMarker: 'Membership',
          });
        } else {
        navigation.navigate('ClassDescription', {
          key: Math.random().toString(),
          _id: details._id,
          classId: details._id,
          name: details.name,
          description: details.description,
          studioName: (details.resortName || details.studioName),
          time: details.time,
          date: details.date,
          address: details.address,
          address2: details.address2,
          cityState: details.cityState,
          zipcode: details.zipcode,
          instructor: details.instructor,
          price: details.price,
          currency: details.currency,
          typeClassId: details.typeClassId,
          providerId: details.providerId,
          profileImage: details.profileImage,
          maxParticipants: details.maxParticipants,
          token: details.token,
          clickedMarker: 'Class',
        });
        }
        } else {
          Alert.alert('Deep Link', `Invalid token: ${classToken}`);        
        }
      }
    };


    useEffect(() => {
      const getUrl = async () => {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          handleDeepLink({ url: initialUrl });
        }
      };

      getUrl();

      const linkingListener = Linking.addEventListener('url', handleDeepLink);

      return () => {
        linkingListener.remove();
      };
    }, []);

    const { userLoggedIn, setUserLoggedIn } = useContext(NavigationContext);

    const [userData, setUserData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        profileImage: ''
      });

    const [pageLoading, setPageLoading] = useState(true);

    const [locationPermission, setLocationPermission] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [typeClasses, setTypeClasses] = useState([]);
    const [typeClassesEl, setTypeClassesEl] = useState([]);
    const [userTypes, setUserTypes] = useState([]);
    const [token, setToken] = useState();

    const [userLocation, setUserLocation] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState(null);
  
    const [initialRegion, setInitialRegion] = useState(null);

    const mapRef = useRef();
    /** Latest map region from the map view (for zoom-preserving focus nudges). */
    const lastMapRegionRef = useRef(null);
    const markersRef = useRef([]);
    const hasSyncedInitialRegionRef = useRef(false);

    const fadeAnim = useRef(new Animated.Value(0)).current; // Initial opacity for the map fade-in
  
    const [activeMarkerId, setActiveMarkerId] = useState(null);

    const handleResetRegion = () => {
      setSelectedMapPin(null);
      setSelectedLocation(initialRegion)
      console.log(initialRegion)
      setSearchQuery('');
      setMapRegion(initialRegion)
      if (initialRegion) {
        setTimeout(() => {
          mapRef.current?.animateToRegion(initialRegion, 450);
        }, 80);
      }
    };

    const [markers, setMarkers] = useState([]);
    const [retreatsMarkers, setRetreatsMarkers] = useState([]);
    const [membershipsMarkers, setMembershipsMarkers] = useState([]);
    /** null = show all; otherwise show only that marker kind */
    const [mapMarkerFilter, setMapMarkerFilter] = useState(null);

    const toggleMapMarkerFilter = (filter) => {
      setSelectedMapPin(null);
      setMapMarkerFilter((current) => (current === filter ? null : filter));
    };

    const currentDate = new Date(); // Get the current date

    // Calculate the date exactly one month from the current date
    const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());

    // Format the dates as strings
    const currentDateString = `${currentDate.getMonth() + 1}/${currentDate.getDate()}/${currentDate.getFullYear()}`;
    const nextMonthDateString = `${nextMonthDate.getMonth() + 1}/${nextMonthDate.getDate()}/${nextMonthDate.getFullYear()}`;


    /** Selected map pin; native Callout is unreliable on Android — we show this in a React overlay. */
    const [selectedMapPin, setSelectedMapPin] = useState(null);
    /** Screen position (relative to MapView) for floating pin detail card */
    const [pinAnchor, setPinAnchor] = useState(null);
    const selectedMapPinRef = useRef(null);
    const suppressMapDismissRef = useRef(false);

    useEffect(() => {
      selectedMapPinRef.current = selectedMapPin;
    }, [selectedMapPin]);

    useEffect(() => {
      if (Platform.OS !== 'ios') return;
      [MAP_ICON_MEMBERSHIP, MAP_ICON_RETREAT, MAP_ICON_CLASS].forEach((src) => {
        const resolved = Image.resolveAssetSource(src);
        if (resolved?.uri) Image.prefetch(resolved.uri).catch(() => {});
      });
    }, []);

    const syncPinAnchor = (marker) => {
      if (!marker || !mapRef.current?.pointForCoordinate) {
        setPinAnchor(null);
        return;
      }
      const lat = parseFloat(marker.latitude);
      const lng = parseFloat(marker.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setPinAnchor(null);
        return;
      }
      mapRef.current
        .pointForCoordinate({ latitude: lat, longitude: lng })
        .then((pt) => {
          if (pt && Number.isFinite(pt.x) && Number.isFinite(pt.y)) {
            setPinAnchor(pt);
          } else {
            setPinAnchor({ x: width / 2, y: height * 0.35 });
          }
        })
        .catch(() => setPinAnchor({ x: width / 2, y: height * 0.35 }));
    };

    const focusMapOnMarkerForCallout = (lat, lng) => {
      if (!mapRef.current?.animateToRegion) return;
      const base = lastMapRegionRef.current;
      const latDelta =
        base && Number.isFinite(base.latitudeDelta) && base.latitudeDelta > 0
          ? base.latitudeDelta
          : 0.05;
      const lngDelta =
        base && Number.isFinite(base.longitudeDelta) && base.longitudeDelta > 0
          ? base.longitudeDelta
          : 0.05;
      mapRef.current.animateToRegion(
        {
          latitude: lat + MAP_PIN_FOCUS_LAT_BIAS * latDelta,
          longitude: lng,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        },
        380
      );
    };

    useEffect(() => {
      if (!selectedMapPin) {
        setPinAnchor(null);
        return;
      }
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => syncPinAnchor(selectedMapPin.marker));
      });
      return () => cancelAnimationFrame(id);
    }, [selectedMapPin]);
    const [visibleMarkers, setVisibleMarkers] = useState([]);
    const [mapRegion, setMapRegion] = useState(null);

      // Function to check if a marker is within the visible region
    const isMarkerVisible = (marker, region) => {
      const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
      return (
        marker.latitude >= latitude - latitudeDelta / 2 &&
        marker.latitude <= latitude + latitudeDelta / 2 &&
        marker.longitude >= longitude - longitudeDelta / 2 &&
        marker.longitude <= longitude + longitudeDelta / 2
      );
    };

    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapLayoutWidth, setMapLayoutWidth] = useState(0);

    const onMapLayout = (e) => {
      const mw = e.nativeEvent.layout.width;
      if (mw > 0) {
        setMapLayoutWidth(mw);
      }
      setMapLoaded(true);
      const pin = selectedMapPinRef.current;
      if (pin) {
        requestAnimationFrame(() => syncPinAnchor(pin.marker));
      }
    };

    const CustomCallout = ({ title, time, description, address, price, currency }) => {
      return (
          <View style={[styles.calloutTextContainer, styles.mapPinBubbleCalloutBody]}>
            <Text style={styles.studioText}>{title}</Text>
            <Text style={styles.classText}>{description}</Text>
            <Text style={styles.addressText}>{time}</Text>
            <Text style={styles.addressText}>{address}</Text>
            {/* <Text style={styles.addressText}>{openSpots}</Text> */}
            <Text style={styles.priceText}>{price} {currency}</Text>
            <View style={styles.bookItButton}>
              <Text style={styles.bookItText}>Buy Ticket!</Text>
            </View>
          </View>
      )
    }

    const onMapPinPress = (kind, marker) => {
      suppressMapDismissRef.current = true;
      setTimeout(() => {
        suppressMapDismissRef.current = false;
      }, 500);
      const idStr = String(marker._id);
      const prev = selectedMapPinRef.current;
      const togglingOff = prev && String(prev.marker._id) === idStr;
      setSelectedMapPin((p) => {
        if (p && String(p.marker._id) === idStr) return null;
        return { kind, marker };
      });
      if (togglingOff) return;
      const lat = parseFloat(marker.latitude);
      const lng = parseFloat(marker.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        requestAnimationFrame(() => focusMapOnMarkerForCallout(lat, lng));
      }
    };

    const openSelectedMapPinDetail = () => {
      if (!selectedMapPin) return;
      const { kind, marker } = selectedMapPin;
      if (kind === 'Studio') {
        if (marker.website) {
          Linking.openURL(marker.website).catch(() => {});
        }
        return;
      }
      if (kind === 'Membership') {
        navigation.navigate('ClassDescription', {
          key: Math.random().toString(),
          classId: marker._id,
          name: marker.name,
          type: marker.type,
          description: marker.description,
          studioName: (marker.resortName || marker.studioName),
          startDate: marker.startDate,
          endDate: marker.endDate,
          address: marker.address,
          address2: marker.address2,
          cityState: marker.cityState,
          zipcode: marker.zipcode,
          price: marker.price,
          currency: marker.currency,
          typeClassId: marker.typeClassId,
          providerId: marker.providerId,
          profileImage: marker.profileImage,
          duration: marker.duration,
          token: marker.token,
          clickedMarker: 'Membership',
        });
        return;
      }
      if (kind === 'Retreat') {
        navigation.navigate('ClassDescription', {
          key: Math.random().toString(),
          classId: marker._id,
          name: marker.name,
          description: marker.description,
          studioName: (marker.resortName || marker.studioName),
          startDate: marker.startDate,
          endDate: marker.endDate,
          address: marker.address,
          address2: marker.address2,
          cityState: marker.cityState,
          zipcode: marker.zipcode,
          price: marker.price,
          currency: marker.currency,
          typeClassId: marker.typeClassId,
          providerId: marker.providerId,
          profileImage: marker.profileImage,
          maxParticipants: marker.maxParticipants,
          clickedMarker: 'Retreat',
        });
        return;
      }
      navigation.navigate('ClassDescription', {
        key: Math.random().toString(),
        classId: marker._id,
        name: marker.name,
        type: marker.type,
        description: marker.description,
        studioName: (marker.resortName || marker.studioName),
        time: marker.time,
        date: marker.date,
        address: marker.address,
        address2: marker.address2,
        cityState: marker.cityState,
        zipcode: marker.zipcode,
        instructor: marker.instructor,
        price: marker.price,
        currency: marker.currency,
        typeClassId: marker.typeClassId,
        providerId: marker.providerId,
        profileImage: marker.profileImage,
        zoomUrl: marker.zoomUrl,
        maxParticipants: marker.maxParticipants,
        token: marker.token,
        clickedMarker: 'Class',
      });
    };

    const handleShareSelectedMapPin = async () => {
      const pin = selectedMapPinRef.current;
      if (!pin?.marker?.token) return;
      if (pin.kind !== 'Class' && pin.kind !== 'Membership') return;
      const listingType = pin.kind === 'Membership' ? 'membership' : 'class';
      await shareListingFromToken(pin.marker.token, pin.marker, { listingType });
    };

    const handleSearch = async () => {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          searchQuery
          )}&key=AIzaSyA7d8_loHucD991mYHk4yvjrnTfiLdv7EI`
        );
    
        if (response.ok) {
          const data = await response.json();
          if (data.results.length > 0) {
            const location = data.results[0].geometry.location;
            console.log(location)
            const searchedRegion = {
            latitude: location.lat,
            longitude: location.lng,
            latitudeDelta: 0.05, // Adjust the delta values as needed
            longitudeDelta: 0.05,
          };
            setMapRegion(searchedRegion);
            setSelectedLocation(searchedRegion);
            setTimeout(() => {
              mapRef.current?.animateToRegion(searchedRegion, 450);
            }, 80);
          } else {
            console.warn('Location not found');
          }
        } else {
          console.error('API request failed');
        }
      } catch (error) {
        console.error('Error searching location: ', error);
      }
    };

  const getNearestClassMarkers = (markers, region) => {
  // Step 1: Filter markers within the visible region
  const visible = markers.filter(marker => isMarkerVisible(marker, region));

  // Step 2: Group markers by coordinates (latitude, longitude)
  const groupedByLocation = visible.reduce((acc, marker) => {
    if (!marker.latitude || !marker.longitude || !marker.date || !marker.time) {
      console.warn('Skipping marker with missing coordinates or date/time:', marker);
      return acc;
    }

    const key = `${marker.latitude},${marker.longitude}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(marker);
    return acc;
  }, {});

  // Step 3: For each location, select the marker with the nearest future date
  const nearestMarkers = Object.values(groupedByLocation).map(group => {
    if (group.length === 1) return group[0]; // If only one marker, return it

    // Sort by date and time to find the earliest future class
    return group.reduce((earliest, current) => {
      const currentDateTime = moment(
        `${current.date} ${current.time}`,
        'MMMM DD, YYYY h:mm A'
      );
      const earliestDateTime = earliest
        ? moment(`${earliest.date} ${earliest.time}`, 'MMMM DD, YYYY h:mm A')
        : null;

      // Only consider future classes
      if (!currentDateTime.isSameOrAfter(moment())) {
        return earliest;
      }

      // If no earliest yet, or current is earlier, return current
      if (!earliest || currentDateTime.isBefore(earliestDateTime)) {
        return current;
      }
      return earliest;
    }, null);
  });

  // Filter out null values (in case no future classes exist in a group)
  return nearestMarkers.filter(marker => marker !== null);
};

  const applyVisibleMarkersForRegion = (region, markerList = markersRef.current) => {
    if (!region || !markerList?.length) return;
    const filtered = getNearestClassMarkers(markerList, region);
    setVisibleMarkers((prev) => {
      const prevKey = prev.map((m) => String(m._id)).sort().join(',');
      const nextKey = filtered.map((m) => String(m._id)).sort().join(',');
      return prevKey === nextKey ? prev : filtered;
    });
  };

  const applyVisibleMarkersDebouncedRef = useRef(null);

  useEffect(() => {
    markersRef.current = markers;
    const region = lastMapRegionRef.current || initialRegion;
    if (region && mapLoaded) {
      applyVisibleMarkersForRegion(region, markers);
    }
  }, [markers, mapLoaded, initialRegion]);

  useEffect(() => {
    const run = debounce((region) => {
      applyVisibleMarkersForRegion(region);
    }, 320);
    applyVisibleMarkersDebouncedRef.current = run;
    return () => run.cancel();
  }, []);

  // Request user's location once on mount (not when markers refresh).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (status !== 'granted') {
          console.warn('Location permission denied');
          return;
        }

        const { latitude, longitude } = await resolveMapCoordinates();
        if (cancelled) return;

        setUserLocation({ latitude, longitude });

        const initialRegion = {
          latitude,
          longitude,
          latitudeDelta: MAP_REGION_DELTA,
          longitudeDelta: MAP_REGION_DELTA,
        };

        setInitialRegion(initialRegion);

        let zoomLevel = Math.log2(360 / initialRegion.latitudeDelta);
        zoomLevel = Math.round(zoomLevel * 1.02);

        const url = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoomLevel}&size=${roundedWidth}x${roundedHeight}&key=AIzaSyB4dfNSF-cCF1wc9Hv_f-rEvJUOG0sSuaU`;
        setStaticMapUrl(url);
        setLocationPermission(true);

        lastMapRegionRef.current = initialRegion;
        applyVisibleMarkersForRegion(initialRegion, markersRef.current);
      } catch (err) {
        if (!cancelled) {
          console.error('Error initializing map location:', err);
        }
      } finally {
        if (!cancelled) {
          setPageLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

    useEffect(() => {
      // Fetch locations from the API
      ( async () => {
        try {
          const response = await fetch(`${config.apiUrl}/classes`); // Replace with your API URL
          if (response.ok) {
            const data = await response.json();
              // Get the current date and time
              const currentDate = moment();

                // Filter out classes that are before the current date and time
            const filteredMarkers = await Promise.all(
              data.map(async (marker) => {
                // Parse class date and time strings into Moment objects
                const classDateTime = moment(marker.date + ' ' + marker.time, 'MMMM DD, YYYY h:mm A');
                // Only process markers with valid dates
                if (classDateTime.isSameOrAfter(currentDate)) {
                  // try {
                  //   // Check if the providerId is valid
                  //   const providerResponse = await fetch(
                  //     `${config.apiUrl}/classes/get-details/${marker.providerId}`
                  //   );
                  //   if (providerResponse.ok) {
                  //     const providerData = await providerResponse.json();
                  //     return providerData.isValid ? marker : null; // Include the marker only if the providerId is valid
                  //   } else {
                  //     console.error(`Failed to validate providerId: ${marker.providerId}`);
                  //     return null;
                  //   }
                  // } catch (error) {
                  //   console.error(`Error validating providerId: ${marker.providerId}`, error);
                  //   return null;
                  // }
                  return marker;
                }
                return null;
              })
            );
            console.log('filtered markers', filteredMarkers)

            // Filter out null values from the result
            const validMarkers = filteredMarkers.filter((marker) => marker !== null);
            // Set the filtered markers
            setMarkers(validMarkers);
          } else {
            console.error('API request failed');
          }
        } catch (error) {
          console.error('Error fetching data: ', error);
        }
      })();
    }, []); // The empty dependency array ensures the effect runs once on component mount
  

  
    // useEffect(() => {
    //   setLoading(true);
    //   setPageLoading(true);

    //     const refreshToken = async (userId) => {

    //       try {
    //         const response = await fetch(`${config.apiUrl}/users/refresh`, {
    //           method: 'POST',
    //           headers: {
    //             'Content-Type': 'application/json',
    //           },
    //           body: JSON.stringify({ userId }),
    //         });
    //         const responseData = await response.json();
    
    //         if (response.ok) {
    //           const newToken = responseData.token;
    //           await AsyncStorage.setItem('userToken', newToken);
    //           // console.log('refreshed token', newToken)
    //           return newToken;
    //         } else {
    //           console.error('Token refresh failed:', responseData);
    //           setUserLoggedIn(false);
    //           return null;
    //         }
    //       } catch (error) {
    //         console.error('Error refreshing token:', error);
    //         setUserLoggedIn(false);
    //         return null;
    //       }
    //     };

      useEffect(() => {
        const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch user token from AsyncStorage
      const storedToken = await AsyncStorage.getItem('userToken');
      console.log('Stored token:', storedToken);
      if (!storedToken) {
        console.error('User token not found. Please log in.');
        Alert.alert('Error', 'No user token found. Please log in again.');
        setUserLoggedIn(false);
        setLoading(false);
        return;
      }
      setToken(storedToken);

      // Fetch user data
      const userResp = await fetch(`${config.apiUrl}/users/get`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({ token: storedToken }),
      });
      console.log('userResp status:', userResp.status);
      if (userResp.status !== 200) {
        console.error('User fetch failed with status:', userResp.status);
        Alert.alert('Session Expired', 'You have been signed out due to inactivity. Please log back in.');
        setUserLoggedIn(false);
        setLoading(false);
        return;
      }
      const userDataResponse = await userResp.json();
      console.log('userResp data:', userDataResponse);

      // Validate user data
      if (!userDataResponse || !userDataResponse._id) {
        console.error('Invalid user data received:', userDataResponse);
        Alert.alert('Error', 'Failed to load user data. Please try again.');
        setLoading(false);
        return;
      }

      // Store user data in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(userDataResponse));
      console.log('Stored user in AsyncStorage:', userDataResponse);
      syncMySupabaseIdFromUser(userDataResponse);

      // Update userData state
      setUserData({
        email: userDataResponse.email || '',
        firstName: userDataResponse.firstName || 'Guest',
        lastName: userDataResponse.lastName || '',
        phoneNumber: userDataResponse.phoneNumber || '',
        profileImage: userDataResponse.profileImage || '',
      });

      const { _id: userId } = userDataResponse;

      // Refresh token
      const response = await fetch(`${config.apiUrl}/users/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      const responseData = await response.json();
      console.log('Token refresh response:', responseData);

      if (response.ok) {
        await AsyncStorage.setItem('userToken', responseData.token);
        console.log('Token refreshed and stored:', responseData.token);
      } else {
        console.error('Token refresh failed:', responseData);
        Alert.alert('Error', 'Failed to refresh session. Please log in again.');
        setUserLoggedIn(false);
        setLoading(false);
        return;
      }

      // Fetch type classes
      const typeClassResp = await fetch(`${config.apiUrl}/types`, {
        method: 'GET',
      });
      const typeClassData = await typeClassResp.json();
      console.log('Type passes:', typeClassData);

      // Fetch user type classes
      const userTypeClassResp = await fetch(`${config.apiUrl}/u-types/user`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: storedToken }),
      });
      const userTypeClassData = await userTypeClassResp.json();
      console.log('User type passes:', userTypeClassData);

      setUserTypes(userTypeClassData);
      setTypeClasses(typeClassData);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load user data. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };
      fetchData();
    }, []);
  

    useEffect(() => {
      // Fetch locations from the API
      ( async () => {
        try {
          const response = await fetch(`${config.apiUrl}/memberships`); // Replace with your API URL
          if (response.ok) {
            const membershipsData = await response.json();    
            setMembershipsMarkers(membershipsData);
          } else {
            console.error('API request failed');
          }
        } catch (error) {
          console.error('Error fetching data: ', error);
        }
      })();
    }, []); // The empty dependency array ensures the effect runs once on component mount
  

    useEffect(() => {
      // Fetch locations from the API
      ( async () => {
        try {
          const response = await fetch(`${config.apiUrl}/retreats`); // Replace with your API URL
          if (response.ok) {
            const retreatsData = await response.json();
            console.log('retreats data', retreatsData)
              // Get the current date and time
              const currentDate = moment();

              // Filter out classes that are before the current date and time
              const filteredRetreatsMarkers = retreatsData.filter(marker => {
                  // Parse class date and time strings into Moment objects
                  const classDateTime = moment(marker.startDate);
                  console.log('classdatetime', classDateTime)
                  // Compare with the current date and time
                  return classDateTime.isSameOrAfter(currentDate);
              });

              // Set the filtered markers
              console.log(filteredRetreatsMarkers)
              setRetreatsMarkers(filteredRetreatsMarkers);
          } else {
            console.error('API request failed');
          }
        } catch (error) {
          console.error('Error fetching data: ', error);
        }
      })();
    }, []); // The empty dependency array ensures the effect runs once on component mount
  


      // Trigger fade-in when the map is loaded. Animated opacity + useNativeDriver breaks Google Maps on many Android devices.
  useEffect(() => {
    if (!mapLoaded) return;
    if (Platform.OS === 'android') {
      fadeAnim.setValue(1);
      setPageLoading(false);
      return;
    }
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => setPageLoading(false));
  }, [mapLoaded]);
  

  const getTimeDisplay = (duration, startDate) => {
    if (!duration) return `${formatDate(startDate)} - Unknown duration`;
  
    const start = new Date(startDate); // Start date as a Date object
    let end = new Date(startDate); // Copy the start date
  
    switch (duration.trim().toLowerCase()) {
      case 'day pass (1 day)':
        return `${formatDate(start)} (Day Pass)`;
  
      case 'weekly (1 week)':
        end.setDate(start.getDate() + 7);
        return `${formatDate(start)} - ${formatDate(end)} (Weekly)`;
  
      case 'monthly (1 month)':
        end.setMonth(start.getMonth() + 1);
        return `${formatDate(start)} - ${formatDate(end)} (Monthly)`;
  
      case 'quarterly (3 months)':
        end.setMonth(start.getMonth() + 3);
        return `${formatDate(start)} - ${formatDate(end)} (Quarterly)`;
  
      case 'annual (1 year)':
        end.setFullYear(start.getFullYear() + 1);
        return `${formatDate(start)} - ${formatDate(end)} (Annual)`;
  
      default:
        return `${formatDate(start)} - Unknown duration`;
    }
  };
  
  // Helper function to format the date as MM/DD/YYYY
  const formatDate = (date) => {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };



    const [loaded] = useFonts({
      effortless: require('../assets/fonts/effortless.regular.ttf'),
      bebasNeue: require('../assets/fonts/BebasNeue-Regular.ttf'),
      americanTypewriter: require('../assets/fonts/american-typewriter.ttf'),
      americanTypewriterBold: require('../assets/fonts/american-typewriter-bold.ttf'),
      aptosDisplayBold: require('../assets/fonts/Aptos-Display-Bold.ttf')
    });
     
    if (!loaded) {
      return null;
    }

    const renderMapPinMarker = (marker, kind, iconSource) => {
      const coord = {
        latitude: parseFloat(marker.latitude),
        longitude: parseFloat(marker.longitude),
      };
      if (Platform.OS === 'android') {
        return (
          <Marker
            key={marker._id}
            coordinate={coord}
            image={iconSource}
            anchor={{ x: 0.5, y: 1 }}
            onPress={() => onMapPinPress(kind, marker)}
          />
        );
      }
      return (
        <MapPinMarker
          key={marker._id}
          marker={marker}
          iconSource={iconSource}
          onPress={() => onMapPinPress(kind, marker)}
        />
      );
    };

    const mapCalloutScreenPt = selectedMapPin
      ? pinAnchor ?? { x: width / 2, y: height * 0.38 }
      : null;

    const mapCoordWidth = mapLayoutWidth > 0 ? mapLayoutWidth : width;

    const calloutBubbleLeft =
      mapCalloutScreenPt != null
        ? Math.min(
            Math.max(
              8,
              mapCalloutScreenPt.x - MAP_CALLOUT_WIDTH / 2 + MAP_CALLOUT_NUDGE_X
            ),
            mapCoordWidth - MAP_CALLOUT_WIDTH - 8
          )
        : 0;
    const calloutArrowLeft =
      mapCalloutScreenPt != null
        ? Math.min(
            Math.max(
              4,
              mapCalloutScreenPt.x -
                calloutBubbleLeft -
                MAP_CALLOUT_ARROW_W / 2 +
                MAP_CALLOUT_ARROW_PIN_OFFSET_X
            ),
            MAP_CALLOUT_WIDTH - MAP_CALLOUT_ARROW_W - 4
          )
        : 0;

    return (
      // <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.mapContainer}>
        {(locationPermission && !staticMapUrl) && (
          <Modal
            transparent={true}
            animationType={'none'}
            visible={pageLoading}
            onRequestClose={() => setPageLoading(false)}>
            <View style={styles.modalPageBackground}>
              <View style={styles.loaderContainer}>
                <View style={styles.titleTextContainer}>
                <MyText title={'Skimatt'} style={styles.ymLoaderTitle} h3 />
                  <View style={styles.webViewContainer}>
                    <ActivityIndicator style={styles.loaderIcon} size="large" color="#0000ff" />
                    <Text style={styles.loadingText}>Currently loading the Skimatt map...</Text>
                    <View style={styles.ymIconContainerWithinLoader}>
                      <Image style={styles.ymIconWithinLoader} source={require('../img/sm-icon red.png')} />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </Modal>
        )}
            <View style={styles.titleContainer}>
              <MyText title={`Skimatt`} style={styles.ymTitle} h1 />
              <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
                <Image style={styles.profileIcon} source={userData.profileImage ? { uri: userData.profileImage } : require ('../img/profile-user.png')} />
              </TouchableOpacity>
            </View>
            <View style={styles.container}>
            <TextInput
              style={styles.enterCodeField}
              placeholder="Enter location"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.submitButton} onPress={() => handleSearch()}>
              <Text style={styles.bookItText}>Search</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.locationButtonContainer}
              onPress={handleResetRegion}
            >
              <FontAwesomeIcon icon={faLocationCrosshairs} size={32} backgroundColor='transparent' />
              <Text style={styles.yourLocationText}>Your Location</Text>
            </TouchableOpacity>
      
            <View style={styles.ymIconLegendContainer}>
              <TouchableOpacity
                style={[
                  styles.ymIconLegendTextContainer,
                  mapMarkerFilter === 'class' && styles.ymIconLegendTextContainerSelected,
                  mapMarkerFilter && mapMarkerFilter !== 'class' && styles.ymIconLegendDimmed,
                ]}
                onPress={() => toggleMapMarkerFilter('class')}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: mapMarkerFilter === 'class' }}
              >
                <Image style={styles.ymIconLegend} source={require('../img/sm-icon red.png')} />
                <Text
                  style={[
                    styles.ymIconLegendText,
                    mapMarkerFilter === 'class' && styles.ymIconLegendTextSelected,
                  ]}
                >
                  Passes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.ymIconLegendTextContainer,
                  mapMarkerFilter === 'membership' && styles.ymIconLegendTextContainerSelected,
                  mapMarkerFilter && mapMarkerFilter !== 'membership' && styles.ymIconLegendDimmed,
                ]}
                onPress={() => toggleMapMarkerFilter('membership')}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: mapMarkerFilter === 'membership' }}
              >
                <Image style={styles.ymIconLegend} source={require('../img/sm-icon blue.png')} />
                <Text
                  style={[
                    styles.ymIconLegendText,
                    mapMarkerFilter === 'membership' && styles.ymIconLegendTextSelected,
                  ]}
                >
                  Memberships
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.ymIconLegendTextContainer,
                  mapMarkerFilter === 'retreat' && styles.ymIconLegendTextContainerSelected,
                  mapMarkerFilter && mapMarkerFilter !== 'retreat' && styles.ymIconLegendDimmed,
                ]}
                onPress={() => toggleMapMarkerFilter('retreat')}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: mapMarkerFilter === 'retreat' }}
              >
                <Image style={styles.ymIconLegend} source={require('../img/sm-icon.png')} />
                <Text
                  style={[
                    styles.ymIconLegendText,
                    mapMarkerFilter === 'retreat' && styles.ymIconLegendTextSelected,
                  ]}
                >
                  Retreats
                </Text>
              </TouchableOpacity>
            </View>

              {(staticMapUrl && !mapLoaded) && (
                <View style={styles.blurFallback}>                  
                  <Image
                    source={{ uri: staticMapUrl }}
                    style={styles.staticMap}
                    resizeMode="cover"
                  />
                </View>
              )}
            
            <Animated.View
              style={[
                styles.mapAnimContainer,
                Platform.OS === 'android' ? { opacity: 1 } : { opacity: fadeAnim },
              ]}
            >
              {(userLocation && staticMapUrl && !pageLoading) && (
                <View style={styles.mapStack}>
                <MapView 
                  ref={mapRef}
                  onPress={() => {
                    Keyboard.dismiss();
                    if (suppressMapDismissRef.current) return;
                    setSelectedMapPin(null);
                  }}
                  onRegionChangeComplete={(region) => {
                    lastMapRegionRef.current = region;
                    if (!hasSyncedInitialRegionRef.current) {
                      hasSyncedInitialRegionRef.current = true;
                      applyVisibleMarkersForRegion(region);
                    } else {
                      applyVisibleMarkersDebouncedRef.current?.(region);
                    }
                    const pin = selectedMapPinRef.current;
                    if (pin) {
                      requestAnimationFrame(() => syncPinAnchor(pin.marker));
                    }
                  }}
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  // showsUserLocation={true}
                  // showsMyLocationButton={false}
                  initialRegion={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    latitudeDelta: 0.05, // Adjust the delta values as needed to control the zoom level
                    longitudeDelta: 0.05,
                  }}
                  onLayout={onMapLayout}
                  onMapReady={() => {
                    const region =
                      initialRegion || {
                        latitude: userLocation.latitude,
                        longitude: userLocation.longitude,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                      };
                    lastMapRegionRef.current = region;
                    setMapLoaded(true);
                    applyVisibleMarkersForRegion(region);
                    // Native map often omits markers until the region is set programmatically.
                    setTimeout(() => {
                      mapRef.current?.animateToRegion(region, 1);
                    }, 50);
                  }}
                >
                  
                  {(mapLoaded || staticMapUrl) && (
                  <>
                   
                   
                    <Marker
                      coordinate={userLocation}
                      // title="You are here"
                      // Add custom styling to the marker here
                    />

                    {selectedLocation && (
                            <Marker
                            coordinate={selectedLocation}
                            // title="You are here"
                            // Add custom styling to the marker here
                          />
                    )}
                  {studioMarkers.map((marker) => {
                    if (parseFloat(marker.latitude) && parseFloat(marker.longitude)) {
                      return renderMapPinMarker(marker, 'Studio', MAP_ICON_CLASS);
                    }
                    return null;
                  })}

                  {(mapMarkerFilter === null || mapMarkerFilter === 'membership') &&
                    membershipsMarkers.map((marker) => {
                    if (parseFloat(marker.latitude) && parseFloat(marker.longitude)) {
                      return renderMapPinMarker(marker, 'Membership', MAP_ICON_MEMBERSHIP);
                    }
                    return null;
                  })}

                  {(mapMarkerFilter === null || mapMarkerFilter === 'retreat') &&
                    retreatsMarkers.map((marker) => {
                    if (parseFloat(marker.latitude) && parseFloat(marker.longitude)) {
                      return renderMapPinMarker(marker, 'Retreat', MAP_ICON_RETREAT);
                    }
                    return null;
                  })}

                  {(mapMarkerFilter === null || mapMarkerFilter === 'class') &&
                    visibleMarkers.map((marker) => {
                    if (parseFloat(marker.latitude) && parseFloat(marker.longitude)) {
                      return renderMapPinMarker(marker, 'Class', MAP_ICON_CLASS);
                    }
                    return null;
                  })}


                  </>
                  )}
                
                </MapView>

                {selectedMapPin && mapCalloutScreenPt && (
                  <View style={styles.mapPinBubbleLayer} pointerEvents="box-none">
                    <View
                      style={[
                        styles.mapPinBubble,
                        {
                          left: calloutBubbleLeft,
                          top: Math.max(
                            8,
                            mapCalloutScreenPt.y -
                              MAP_CALLOUT_ABOVE_PIN +
                              MAP_CALLOUT_NUDGE_Y
                          ),
                        },
                      ]}
                      pointerEvents="auto"
                    >
                      <View style={styles.mapPinBubbleCard}>
                        <View style={styles.mapPinBubbleRow}>
                          <TouchableOpacity
                            activeOpacity={0.92}
                            onPress={openSelectedMapPinDetail}
                            style={styles.mapPinBubbleMainTouchable}
                          >
                            {selectedMapPin.kind === 'Studio' && (
                              <View style={[styles.calloutTextContainer, styles.mapPinBubbleCalloutBody]}>
                                <Text style={styles.studioText}>{selectedMapPin.marker.name}</Text>
                                <Text style={styles.addressText}>{selectedMapPin.marker.address}</Text>
                                {selectedMapPin.marker.website ? (
                                  <View style={styles.bookItButton}>
                                    <Text style={styles.bookItText}>Website</Text>
                                  </View>
                                ) : null}
                              </View>
                            )}
                            {selectedMapPin.kind === 'Membership' && (
                              <CustomCallout
                                title={(selectedMapPin.marker.resortName || selectedMapPin.marker.studioName)}
                                description={`${selectedMapPin.marker.name}`}
                                time={getTimeDisplay(selectedMapPin.marker.duration, currentDate)}
                                address={`${selectedMapPin.marker.address}${selectedMapPin.marker.address2 ? ` (${selectedMapPin.marker.address2})` : ''} ${selectedMapPin.marker.cityState}, ${selectedMapPin.marker.zipcode}`}
                                price={`${selectedMapPin.marker.price} (${selectedMapPin.marker.currency})`}
                                currency=""
                              />
                            )}
                            {selectedMapPin.kind === 'Retreat' && (
                              <CustomCallout
                                title={(selectedMapPin.marker.resortName || selectedMapPin.marker.studioName)}
                                description={`${selectedMapPin.marker.name}`}
                                time={`${moment(selectedMapPin.marker.startDate).format('MM/DD/YYYY')} - ${moment(selectedMapPin.marker.endDate).format('MM/DD/YYYY')}`}
                                address={`${selectedMapPin.marker.address}${selectedMapPin.marker.address2 ? ` (${selectedMapPin.marker.address2})` : ''} ${selectedMapPin.marker.cityState}, ${selectedMapPin.marker.zipcode}`}
                                price={`${selectedMapPin.marker.price} (${selectedMapPin.marker.currency})`}
                                currency=""
                              />
                            )}
                            {selectedMapPin.kind === 'Class' && (
                              <CustomCallout
                                title={(selectedMapPin.marker.resortName || selectedMapPin.marker.studioName)}
                                description={`${selectedMapPin.marker.name}`}
                                time={`${selectedMapPin.marker.time}, ${selectedMapPin.marker.date}`}
                                address={`${selectedMapPin.marker.address}${selectedMapPin.marker.address2 ? ` (${selectedMapPin.marker.address2})` : ''} ${selectedMapPin.marker.cityState}, ${selectedMapPin.marker.zipcode}`}
                                price={`${selectedMapPin.marker.price} (${selectedMapPin.marker.currency})`}
                                currency=""
                              />
                            )}
                          </TouchableOpacity>
                          {(selectedMapPin.kind === 'Class' ||
                            selectedMapPin.kind === 'Membership') &&
                          selectedMapPin.marker?.token ? (
                            <TouchableOpacity
                              accessibilityLabel={
                                selectedMapPin.kind === 'Membership'
                                  ? 'Share membership link'
                                  : 'Share pass link'
                              }
                              accessibilityRole="button"
                              style={styles.mapPinShareRail}
                              onPress={handleShareSelectedMapPin}
                              hitSlop={{
                                top: 8,
                                bottom: 8,
                                left: 4,
                                right: 8,
                              }}
                            >
                              <View style={styles.mapPinShareIconRing}>
                                <FontAwesomeIcon
                                  icon={faShareFromSquare}
                                  size={22}
                                  color="#c12818"
                                />
                              </View>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      </View>
                      <View
                        style={[styles.mapPinCalloutArrowSlot, { marginLeft: calloutArrowLeft }]}
                        pointerEvents="none"
                      >
                        <View style={styles.mapPinCalloutArrowStack}>
                          <View style={styles.mapPinCalloutArrowBorder} />
                          <View style={styles.mapPinCalloutArrowFill} />
                        </View>
                      </View>
                    </View>
                  </View>
                )}
                </View>
              )}
            </Animated.View>

            <Modal
            visible={isBookingsModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setIsBookingsModalVisible(false)}
                        style={styles.bookingsModal}

          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.bookingsModalTitleCloseButtonContainer}>
                  <Text style={styles.modalTitle}>Your Current Bookings</Text>
                  <TouchableOpacity style={styles.bookingsModalCloseButton} onPress={() => setIsBookingsModalVisible(false)}>
                    <Text style={styles.bookingsModalCloseButtonText}>X</Text>
                  </TouchableOpacity>
                </View>
                {bookingsLoading ? (
                  <ActivityIndicator size="large" color="#fff" marginVertical='20' />
                ) : bookings.length === 0 ? (
                  <Text style={styles.noBookingsText}>No current bookings found.</Text>
                ) : (
                  <ScrollView style={styles.bookingsList}>
                    {bookings.map((booking) => (
                      <View key={booking._id} style={styles.bookingItem}>
                        <Text style={styles.bookingText}>
                          You have a booking for <Text style={styles.bookingTextBold}>{booking.className}</Text> on <Text style={styles.bookingTextBold}>{booking.classDate}</Text> with <Text style={styles.bookingTextBold}>{(booking.resortName || booking.studioName)}</Text>.
                        </Text>
                          <TouchableOpacity
                            style={styles.chatWithButton}
                            onPress={() => handleChat(booking)}
                          >
                          <Text style={styles.chatWithButtonText}>Chat with <Text style={styles.chatWithButtonTextBold}>{(booking.resortName || booking.studioName)}</Text></Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}
              
              </View>
            </View>
          </Modal>
            </View>
            {mapLoaded || staticMapUrl ?
            <View style={styles.bottomBar}>
              <View style={styles.bottomBarContainer}>
                <TouchableOpacity style={styles.backButtonMap} onPress={() => navigation.navigate("Profile")}>
                  <View style={styles.buttonContents}>
                      <FontAwesomeIcon icon={faArrowLeft} />
                  </View>
                </TouchableOpacity>
            {userData ?
              <TouchableOpacity
                style={styles.showBookingsButton}
                onPress={() => {
                  setIsBookingsModalVisible(true);
                  fetchUserBookings();
                }}
              >
                <Text style={styles.bookItText}>Show Current Bookings</Text>
              </TouchableOpacity>
            : 
              <MyText title={`Enjoy the Skimatt Map!`} style={styles.bottomBarText} bold />
            }
                <View style={styles.ymIconContainer}>
                  <Image style={styles.ymIcon} source={require('../img/sm-icon red.png')} />
                </View>
              </View>
            </View>
            :
            <View style={styles.bottomBarUnloaded}>
              <View style={styles.bottomBarContainer}>
                <TouchableOpacity style={styles.backButtonMap} onPress={() => navigation.navigate("Profile")}>
                  <View style={styles.buttonContents}>
                      <FontAwesomeIcon icon={faArrowLeft} />
                  </View>
                </TouchableOpacity>
                <MyText title={`Enjoy the Skimatt Map!`} style={styles.bottomBarText} bold />
                <View style={styles.ymIconContainer}>
                  <Image style={styles.ymIcon} source={require('../img/sm-icon red.png')} />
                </View>
              </View>
            </View>
            }

        </View>
      // </TouchableWithoutFeedback>

    )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      minHeight: 0,
      backgroundColor: '#ffebd6',
    },
    map: {
      width: '100%',
      flex: 1,
      minHeight: 200,
    },
    staticMap: {
      width: '100%',
      flex: 1,
      minHeight: 200,
    },
    profileIcon: {
        height: 70,
        width: 70,
        margin: 10,
        borderRadius: 50
    },
    titleContainer: {
        paddingTop: 30,
        display: 'flex',
        flexDirection: 'row',
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffebd6',
                
    },
        
    ymTitle: {
        marginHorizontal: 40,
        color: '#c12818',
    },
        
    userIcon: {
        width: 50,
        height: 50,
        borderRadius: 50
    },
        
    bottomBarUnloaded: {
      top: '230%',
      width: '100%',
      height: 100,
      backgroundColor: '#c12818',
    },

    bottomBar: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      height: 140,
      backgroundColor: '#c12818',
    },

    bottomBarContainer: {
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between'  ,
      marginHorizontal: 15,
      paddingVertical: 5
    },

    backButtonMap: {
        width: 60,
        height: 60,
        justifyContent: 'flex-start',
        marginVertical: 15,
    },

    buttonContents: {
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row',
        color: '#7F5345',
        backgroundColor: '#e8987c',
        height: 50,
        fontWeight: 600,
        borderRadius: 50,
        width: 50,
        padding: 20,
    },

    bottomBarText: {
      color: '#c12818',
      fontSize: 20,
      width: 180,
      textAlign: 'center',
      fontFamily: 'bebesNeue'
    },

    ymIconContainer: {
      alignItems: 'center',
      position: 'relative'
    },
  
    markerTouchable: {
      width: 70,  // Increase the size to make the area larger
      height: 70, // Increase the size to make the area larger
      justifyContent: 'center',
      alignItems: 'center',
  },
    ymIcon: {
      width: 50,
      height: 50,
    },

    ymIconLegend: {
      width : 30,
      height: 30
    },

    ymIconLegendContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',       // Allows items to wrap to a new line if needed
      justifyContent: 'space-around', // Centers items in the container
      alignItems: 'center',     // Aligns items vertically in the center
      paddingHorizontal: 10,    // Optional: adds padding around the container
      top: 580,
      position: 'absolute',
      zIndex: 10,
    },

    ymIconLegendTextContainer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 2,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: 'transparent',
    },

    ymIconLegendTextContainerSelected: {
      backgroundColor: '#e8987c',
      borderColor: '#68281B',
    },

    ymIconLegendText: {
      fontFamily: 'americanTypewriterBold',
      textAlign: 'center',
      fontSize: 16,
      marginHorizontal: 6,
      color: '#c12818',
  },

    ymIconLegendDimmed: {
      opacity: 0.4,
    },

    ymIconLegendTextSelected: {
      color: '#c12818',
    },

    bookItButton: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: '#e8987c',
      borderRadius: 20,
      marginHorizontal: 12,
      paddingVertical: 5,
      marginTop: 2,
      width: 120,
    },

  bookItText: {
      fontFamily: 'americanTypewriterBold',
      textAlign: 'center',
      fontSize: 15

  },

  calloutTextContainer: {
    borderColor: '#c12818',
    borderWidth: CALLOUT_PINK_BORDER,
    borderRadius: 10,
    backgroundColor: 'white',
    padding: 5,
    elevation: 2,
    alignItems: 'center',
  },


  studioText: {
    fontFamily: 'americanTypewriterBold',
    textAlign: 'center',
    fontSize: 16
},

  classText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 'bold',
  },

  addressText: {
    textAlign: 'center',
    fontSize: 10
  },

  priceText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
  },

  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#ffebd6',
  },

  mapAnimContainer: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },

  mapStack: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    position: 'relative',
  },

  mapPinBubbleLayer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none',
  },

  mapPinBubble: {
    position: 'absolute',
    width: MAP_CALLOUT_WIDTH,
    zIndex: 100,
    elevation: 20,
    overflow: 'visible',
    flexDirection: 'column',
    alignItems: 'stretch',
  },

  mapPinBubbleCard: {
    width: '100%',
    zIndex: 2,
  },

  mapPinBubbleCalloutBody: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    flex: 1,
    minWidth: 0,
  },

  mapPinBubbleRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
  },

  mapPinBubbleMainTouchable: {
    flex: 1,
    minWidth: 0,
  },

  mapPinShareRail: {
    width: MAP_CALLOUT_SHARE_RAIL,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 50,
    paddingLeft: 10,
  },

  /** Same language as callout (white + peach ring) so the control reads off the map, not a square “box”. */
  mapPinShareIconRing: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#c12818',
    shadowColor: '#c12818',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.5,
    elevation: 4,
  },

  mapPinCalloutArrowSlot: {
    width: MAP_CALLOUT_ARROW_W,
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: -(CALLOUT_PINK_BORDER + 1),
    zIndex: 3,
  },

  mapPinCalloutArrowStack: {
    position: 'relative',
    width: MAP_CALLOUT_ARROW_W,
    height: MAP_CALLOUT_ARROW_H + CALLOUT_PINK_BORDER + 2,
    alignItems: 'center',
  },

  mapPinCalloutArrowBorder: {
    position: 'absolute',
    bottom: 0,
    left: (MAP_CALLOUT_ARROW_W - MAP_CALLOUT_ARROW_OUTER_BASE) / 2,
    width: 0,
    height: 0,
    borderLeftWidth: MAP_CALLOUT_ARROW_OUTER_HALF,
    borderRightWidth: MAP_CALLOUT_ARROW_OUTER_HALF,
    borderTopWidth: MAP_CALLOUT_ARROW_OUTER_TOP,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#c12818',
  },

  mapPinCalloutArrowFill: {
    position: 'absolute',
    bottom: CALLOUT_PINK_BORDER,
    left: (MAP_CALLOUT_ARROW_W - MAP_CALLOUT_ARROW_INNER_BASE) / 2,
    width: 0,
    height: 0,
    borderLeftWidth: MAP_CALLOUT_ARROW_INNER_HALF,
    borderRightWidth: MAP_CALLOUT_ARROW_INNER_HALF,
    borderTopWidth: MAP_CALLOUT_ARROW_INNER_TOP,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
  },

  loadingContainer: {
    flex: 1,
    height: '100%',
    width: '90%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingMap: {
    textAlign: 'center',
    
  },

  enterCodeField: {
    textAlign: 'center',
    marginHorizontal: 50,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginTop: '5%',
    marginBottom: 10,
    color: '#c12818',
    backgroundColor: '#c12818',
    borderRadius: 30,
    width: 300,
    fontSize: 24,
    fontFamily: 'aptosDisplayBold',
    borderColor: '#000',
    borderWidth: 2,
    zIndex: 1,
    position: 'absolute'
  },

  submitButton: {
    backgroundColor: '#e8987c',
    paddingVertical: 10,
    borderRadius: 10,
    borderColor: '#000',
    borderWidth: 2,
    borderRadius: 30,
    position: 'absolute',
    width: 100,
    marginTop: 90,
    marginHorizontal: 150,
    zIndex: 1
  },

  showBookingsButton: {
    backgroundColor: '#e8987c',
    paddingVertical: 10,
    borderRadius: 10,
    borderColor: '#000',
    borderWidth: 2,
    borderRadius: 30,
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',

  },

  locationButtonContainer: {
      backgroundColor: '#e8987c',
      borderColor: '#000',
      borderWidth: 2,
      borderRadius: 50,
      position: 'absolute',
      padding: 8,
      alignItems: 'center',
      zIndex: 1,
      top: 100,
      left: 270
  },

  yourLocationText: {
    fontFamily: 'americanTypewriterBold',
    textAlign: 'center',
    fontSize: 12,
    padding: 5
},


modalPageBackground: {
  flex: 1,
  alignItems: 'center',
  flexDirection: 'column',
  justifyContent: 'space-around',
  backgroundColor: '#c12818',

},

loaderContainer: {
  height: 150,
  width: 200,
  borderRadius: 50,
  justifyContent: 'center',
  alignItems: 'center',
},

loader: {
  width: 50,
  height: 50,
  borderWidth: 5,
  borderColor: '#0000ff',
  borderTopColor: 'transparent',
  borderRadius: 25,
},

loaderIcon: {
  marginVertical: 130,
},

loadingText: {
  textAlign: 'center',
  fontFamily: 'bebesNeue',
  fontSize: 20,
  marginTop: -75
},

webViewContainer: {
  borderWidth: 5,
  borderColor: '#68281B',
  backgroundColor: '#c12818',
  padding: 13,
  borderRadius: 15,
  height: 700,
  width: 350,
},

titleTextContainer: {
  paddingHorizontal: 15,
},

ymLoaderTitle: {
  fontSize: 23,
  fontFamily: 'effortless',
  textAlign: 'center',
  color: '#c12818',
  marginBottom: 10,
},

ymIconContainerWithinLoader: {
  flex:1,
  marginTop: 60,
  alignItems: 'center'
}, 

ymIconWithinLoader: {
  width: 70,
  height: 70,
},

blurFallback: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(255, 255, 255, 0.5)', // semi-transparent white
},
bookingsModal: {
    justifyContent: 'center',
  },

modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 15
    },
    modalContent: {
      backgroundColor: '#c12818',
      padding: 20,
      borderRadius: 10,
      borderColor: '#000',
      borderWidth: 5,
      maxHeight: '80%',
      width: '95%'
    },

    modalTitle: {
      fontSize: 35,
      fontFamily: 'bebasNeue',
      textAlign: 'center',
    },

    bookingsList: {
      width: '100%',
      marginBottom: 15,
    },
    bookingItem: {
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#ccc',
      marginBottom: 10,
    },
    bookingText: {
      fontSize: 16,
      marginBottom: 10,
    },

    bookingTextBold: {
      fontWeight: 'bold',
      color: '#c12818',
      fontSize: 16
    },

    chatButton: {
      backgroundColor: '#e8987c',
      padding: 10,
      borderRadius: 5,
      alignItems: 'center',
    },
    chatButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      fontFamily: 'americanTypewriterBold',
    },
    errorText: {
      fontSize: 16,
      color: 'red',
      textAlign: 'center',
      marginVertical: 20,
      fontFamily: 'americanTypewriter',
    },

    noBookingsText: {
    fontSize: 28,
    color: '#000',
    textAlign: 'center',
    marginVertical: 20,
    fontFamily: 'americanTypewriter',
  },
    

    chatWithButton: {
      borderRadius: 40,
      borderWidth: 3,
      borderColor: '#c12818',
      backgroundColor: '#c12818',
      paddingHorizontal: 10
  },

  chatWithButtonText: {
    fontFamily: 'americanTypewriterBold',
    padding: 10,
    fontSize: 18,
    color:'#e8987c',
    textAlign: 'center'
  },

  chatWithButtonTextBold: {
    fontFamily: 'americanTypewriterBold',
    padding: 10,
    fontSize: 18,
    color:'#fff',
    textAlign: 'center'
  },

     bookingsModalCloseButton: {
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#c12818',
    backgroundColor: '#c12818',
    alignItems: 'center',
    width: 50,
  },

  bookingsModalCloseButtonText: {
    padding: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color:'#e8987c'
  },

    bookingsModalTitleCloseButtonContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },

});

