import React, {useRef, useState, useEffect} from 'react';
import { Text, TextInput, View, StyleSheet, Pressable } from 'react-native';


export default function OtpInputField({ code, setCode, maximumLength, setIsPinReady }) {

    
    const boxArray = new Array(maximumLength).fill(0);
    const inputRef = useRef('');

    const [isInputBoxFocused, setIsInputBoxFocused] = useState(false);
    
    const handleOnPress = () => {
        setIsInputBoxFocused(true);
        inputRef.current.focus();
    }

    const handleOnBlur = () => {
        setIsInputBoxFocused(false);
    };

    useEffect(() => {
        // update pin ready status
        setIsPinReady(code.length === maximumLength);
        // clean up function
        return () => {
          setIsPinReady(false);
        };
      }, [code]);

    const boxDigit = (_, index) => {
        const emptyInput = "";
        const digit = code[index] || emptyInput;

        const isCurrentValue = index === code.length;
        const isLastValue = index === maximumLength - 1;
        const isCodeComplete = code.length === maximumLength;
        
        const isValueFocused = isCurrentValue || (isLastValue && isCodeComplete)

        
        return (
          <View style={ isInputBoxFocused && isValueFocused ? styles.splitBoxesFocused : styles.splitBoxes } key={index}>
            <Text style={styles.splitBoxText}>{digit}</Text>
          </View>
        );
      };

    return (

        <View style={styles.otpInputContainer}>
            <Pressable style={styles.splitOtpBoxesContainer} onPress={handleOnPress}>
                {boxArray.map(boxDigit)}
            </Pressable>
            <TextInput
                keyboardType='numeric'
                style={styles.textInputHidden} 
                value={code}
                onChangeText={setCode}
                maxLength={maximumLength}
                ref={inputRef}
                onBlur={handleOnBlur}
            />
        </View>


       
    )
}

const styles = StyleSheet.create({

    otpInputContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20
    },
 
    textInputHidden: {
        width: 300,
        borderColor: '#e5e5e5',
        borderWidth: 1,
        borderRadius: 15,
        padding: 15,
        marginTop: 50,
        color: '#fff',
        position: 'absolute',
        opacity: 0
    },

    splitOtpBoxesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly'
    },

    splitBoxes: {
        borderColor: '#c12818',
        borderWidth: 2,
        borderRadius: 5,
        padding: 12,
        backgroundColor: '#f4835b',
        minWidth: 50
    },

    splitBoxText: {
        fontSize: 24,
        textAlign: 'center',
        color: '#c12818',
        fontFamily: 'aptosDisplayBold'
    },
    
    splitBoxesFocused: {
        borderColor: '#ecdbba',
        backgroundColor: 'grey'
    }

})

    //    inputField: {
    //     width: 40,
    //     height: 40,
    //     justifyContent: 'center',
    //     alignItems: 'center',
    //     borderBottomColor: '#ccc',
    //     borderBottomWidth: 1,
    //     backgroundColor: '#c12818',
    //     textAlign: 'center'
    // },