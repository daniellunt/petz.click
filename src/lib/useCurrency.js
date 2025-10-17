
import React, { useState, useEffect } from 'react';

const useCurrency = () => {
  const [currency, setCurrency] = useState(() => {
    try {
      const item = window.localStorage.getItem('settings_currency');
      return item ? JSON.parse(item) : { symbol: '$', code: 'USD' };
    } catch (error) {
      console.error("Error reading currency from localStorage", error);
      return { symbol: '$', code: 'USD' };
    }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const item = window.localStorage.getItem('settings_currency');
        setCurrency(item ? JSON.parse(item) : { symbol: '$', code: 'USD' });
      } catch (error) {
        console.error("Error reading currency from localStorage on change", error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return currency;
};

export default useCurrency;
