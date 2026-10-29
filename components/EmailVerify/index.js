import styles from './styles.module.css';
import success from '../../img/success.png'

import React, {useState, useEffect} from 'react'

const EmailVerify = () => {
    const [validUrl, setValidUrl] = useState(false);
  
    return (
    <div>
      {validUrl ? (
        <div className={styles.container} >
            <img src={success} alt='success_img' className={styles.success_img} />
            <h1>email verified successfully</h1>
        </div>
      ): (
        <h1>404 not found</h1>
      )}
    </div>
  )
}

export default EmailVerify;
