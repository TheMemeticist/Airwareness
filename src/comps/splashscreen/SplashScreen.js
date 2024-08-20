import React, { useState, useEffect } from 'react';
import styles from './SplashScreen.module.css';
import dots from './ASP-Logo-Dots.svg';
import box from './ASP-Logo-Box.svg';
import fan from './ASP-Logo-Fan.svg';

const DotsLogo = ({ index }) => (
    <img
        key={index}
        src={dots}
        className={styles['Dots-logo']}
        style={{ animationDelay: `${index * 0.3}s` }}
        alt="ASP Dots Logo"
    />
);

const SplashScreen = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [headerText, setHeaderText] = useState('Air Support Project');
    const numberOfDots = 3;

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 10000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const timer = setTimeout(() => {
            const backspaceAndRetype = async () => {
                for (let i = headerText.length; i > 3; i--) {
                    await new Promise(resolve => setTimeout(resolve, 25));
                    setHeaderText(prev => prev.slice(0, -1));
                }
                const newText = 'Airwareness Support App';
                for (let i = 3; i <= newText.length; i++) {
                    await new Promise(resolve => setTimeout(resolve, 25));
                    setHeaderText(newText.slice(0, i));
                }
            };
            backspaceAndRetype();
        }, 5000);

        return () => clearTimeout(timer);
    }, [isVisible, headerText]);

    if (!isVisible) return null;

    const dotsLogos = Array.from({ length: numberOfDots }).map((_, index) => (
        <DotsLogo key={index} index={index} />
    ));

    return (
        <div className={styles['splash-screen-overlay']}>
            <div className={styles['splash-screen']}>
                <header className={styles['App-header']}>
                    <img src={fan} className={styles['Fan-logo']} alt="ASP Fan Logo" />
                    <img src={box} className={styles['Box-logo']} alt="ASP Box Logo" />
                    {dotsLogos}
                    <div className={styles['loading-container']}>
                        <h1>{headerText}</h1>
                    </div>
                </header>
            </div>
        </div>
    );
};

export default SplashScreen;
