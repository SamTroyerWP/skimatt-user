import * as React from 'react';
import { Text } from 'react-native';
import { useFonts } from 'expo-font';


const MyText = ({ h1, h2, h3, h4, h5,  p, bold, italic, title,style, ...rest }) => {

    const [loaded] = useFonts({
        bebesNeue: require('../assets/fonts/BebasNeue-Regular.ttf'),
        effortless: require('../assets/fonts/effortless.regular.ttf'),
      });
    
      if (!loaded) {
        return null;
      }
    
    return (
        <Text style={[
            h1 && { fontSize: 45, fontFamily: 'effortless' },
            h2 && { fontSize: 32 },
            h3 && { fontSize: 20, fontFamily: 'effortless'} ,
            h4 && { fontSize: 18, fontFamily: 'effortless'},
            h5 && { fontSize: 16 },
            p && { fontSize: 12,  },
            bold && { fontSize: 20, fontWeight: 'bold', fontFamily: 'bebesNeue' },
            italic && { fontStyle: 'italic'},
            style
        ]}{...rest}>{title}</Text>
    );
};

export { MyText }