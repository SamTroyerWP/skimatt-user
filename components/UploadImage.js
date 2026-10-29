import React, { useState, useEffect } from 'react';
import { Image, View, TouchableOpacity, StyleSheet } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import config from '../views/config'; 

export default function UploadImage(props) {

    const [image, setImage] = useState(props.image);

    const addImage = async () => {
        try {

            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                alert('Permission to access camera roll is required!');
                return;
            }

            let _image = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
                base64: true
            });
    
            if (!_image.canceled) {
               
                console.log( 'image uri', _image.assets[0].uri, 'id', props.id);
    
                const imageData = {
                    base64: _image.assets[0].base64,
                    id: props.id, // Conditionally add the id if it exists
                    name: generateFileName(_image.assets[0].uri),
                };
                // const fileExtension = _image.assets[0].uri.split('.').pop().toLowerCase();
                // const fileType = fileExtension === 'jpg' || fileExtension === 'jpeg' ? 'image/jpeg' : 'image/png';

                // const file =  {
                //     uri: _image.assets[0].uri,
                //     type: fileType,
                //     name: generateFileName(_image.assets[0].uri),
                // };

                // console.log('image', _image.assets[0].uri, 'id', props.id);

                // const formData = new FormData();
                // // formData.append('image', {
                // //     uri: _image.assets[0].uri,
                // //     type: 'image/jpeg',
                // //     name: 'image.jpg',
                // // });
                // formData.append('image', file)
    
                // // Conditionally add the token only if it's provided
                // if (props.id) {
                //     formData.append('id', props.id);
                //     console.log('formdata', formData)
                // }
    
                const response = await fetch(`${config.apiUrl}/users/upload`, {
                    method: 'POST',
                    headers: {
                        // 'Content-Type': 'multipart/form-data',
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhZmZ5dGNxdmt2ZHFwdXd6eG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTIxNDc0NzAsImV4cCI6MjAyNzcyMzQ3MH0.cwA6UWiAJFIbOXO9Oy2JX5Nl_G9LnXTHFaUBYEScsMk`,
                    },
                    // body: formData
                    body: JSON.stringify(imageData)
                });

                // if (!response.ok) {
                //     throw new Error('Failed to upload profile image');
                // }
                const responseData = await response.json();
                console.log(responseData)
                setImage(responseData.fileUrl);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            // Handle error
        }
    };
    
    // Function to generate a unique filename based on current timestamp
    const generateFileName = (uri) => {
        const timestamp = new Date().getTime();
        const extension = uri.split('.').pop(); // Get the file extension
        return `${timestamp}.${extension}`;
    };

    useEffect(() => {
        setImage(props.image)
    }, [props.image])

    return (
        <View style={imageUploaderStyles.container}>
            {
                image  && <Image source={{ uri: image }} style={{ width: 70, height: 70 }} />
            }                        
            <View style={imageUploaderStyles.uploadBtnContainer}>
                <TouchableOpacity onPress={addImage} style={imageUploaderStyles.uploadBtn} >
                    <AntDesign name="camera" size={20} color="black" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const imageUploaderStyles=StyleSheet.create({
    container:{
        elevation:2,
        height: 70,
        width: 70,
        backgroundColor:'#efefef',
        position:'relative',
        borderRadius:999,
        overflow:'hidden',
    },

    uploadBtnContainer:{
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        width: '100%',
        height: '40%',
    },
    
    uploadBtn:{
        display:'flex',
        alignItems:"center",
        justifyContent:'center'
    },
    profileIcon: {
        height: 70,
        width: 70,
    },
})

UploadImage.defaultProps = {
    image: undefined,
    token: undefined,
}