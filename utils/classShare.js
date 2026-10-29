import { Share, Platform, Alert } from 'react-native';
import config from '../views/config';

export const possessiveLabel = (name) => {
  const raw = String(name == null || name === '' ? 'Skimatt' : name).trim();
  const base = raw || 'Skimatt';
  return /s$/i.test(base) ? `${base}'` : `${base}'s`;
};

/** Instructor if set; otherwise provider full name from API; else studio / Yogamatt. */
export const getClassShareHighlightName = async ({
  instructor,
  providerId,
  studioName,
}) => {
  const instructorTrim =
    instructor != null ? String(instructor).trim() : '';
  if (instructorTrim) return instructorTrim;
  if (providerId) {
    try {
      const response = await fetch(
        `${config.apiUrl}/providers/get-provider/${providerId}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      if (response.ok) {
        const provider = await response.json();
        const full =
          (provider.fullName != null ? String(provider.fullName).trim() : '') ||
          [provider.firstName, provider.lastName]
            .filter(Boolean)
            .map((s) => String(s).trim())
            .join(' ')
            .trim();
        if (full) return full;
      }
    } catch (_) {
      /* use fallbacks below */
    }
  }
  const studio = studioName != null ? String(studioName).trim() : '';
  return studio || 'Skimatt';
};

/** Share share-card URL only so messengers unfurl og:image as a large preview. */
export async function shareListingFromToken(
  listingToken,
  listingMeta = {},
  { listingType = 'class' } = {}
) {
  const token = listingToken != null ? String(listingToken).trim() : '';
  const isMembership = listingType === 'membership';
  if (!token) {
    Alert.alert(
      'Unable to share',
      isMembership
        ? 'This membership does not have a share link yet.'
        : 'This pass does not have a share link yet.'
    );
    return;
  }

  const deepLink = `skimatt-user://main/classDescription/${token}`;
  const shareUrl = `${config.apiUrl}/classes/share-card?to=${encodeURIComponent(deepLink)}`;
  const highlightName = await getClassShareHighlightName(listingMeta);
  const title = isMembership
    ? `${possessiveLabel(highlightName)} new membership on Skimatt!`
    : `${possessiveLabel(highlightName)} new pass on Skimatt!`;

  try {
    await Share.share(
      Platform.OS === 'ios'
        ? { url: shareUrl }
        : { message: shareUrl, title },
      Platform.OS === 'android' ? { dialogTitle: title } : undefined
    );
  } catch (e) {
    const msg = e?.message != null ? String(e.message) : '';
    if (!/cancel|dismiss/i.test(msg)) {
      Alert.alert('Unable to share', 'Please try again.');
    }
  }
}

/** @deprecated use shareListingFromToken — kept for existing imports */
export async function shareClassFromToken(classToken, classMeta = {}) {
  return shareListingFromToken(classToken, classMeta, { listingType: 'class' });
}
