import React, { createContext, useContext, useState, useEffect } from 'react';
import { Family } from '../types';
import { DataService } from '../services/dataService';

interface FamilyContextType {
  currentFamily: Family | null;
  selectFamily: (familyId: string) => void;
  logoutFamily: () => void;
  isLoading: boolean;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if family is stored in session/local storage
    const storedFamilyId = localStorage.getItem('current_family_id');
    if (storedFamilyId) {
        const families = DataService.getFamilies();
        const family = families.find(f => f.id === storedFamilyId);
        if (family) {
            setCurrentFamily(family);
        }
    }
    setIsLoading(false);
  }, []);

  const selectFamily = (familyId: string) => {
    const families = DataService.getFamilies();
    const family = families.find(f => f.id === familyId);
    if (family) {
      setCurrentFamily(family);
      localStorage.setItem('current_family_id', familyId);
    }
  };

  const logoutFamily = () => {
    setCurrentFamily(null);
    localStorage.removeItem('current_family_id');
  };

  return (
    <FamilyContext.Provider value={{ currentFamily, selectFamily, logoutFamily, isLoading }}>
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};
