import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged } from './firebaseAuth';
import { db, doc, getDoc, setDoc, onSnapshot } from './firebase';

interface AuthContextType {
  user: any | null;
  profile: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({ id: firebaseUser.uid, email: firebaseUser.email, ...firebaseUser });
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let unsubscribeSnapshot: any;
    
    if (user) {
      const fetchProfile = async () => {
        const userRef = doc(db, 'users', user.id);
        
        try {
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.isDisabled) {
              await auth.signOut();
              alert("Your account has been disabled by an administrator.");
              setProfile(null);
              setUser(null);
            } else {
              setProfile({ id: userSnap.id, ...data });
            }
          } else {
            // Profile doesn't exist, create it
            const newProfile = { uid: user.id, email: user.email, role: 'user', createdAt: new Date().toISOString() };
            await setDoc(userRef, newProfile);
            setProfile({ id: user.id, ...newProfile });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
        
        setLoading(false);
      };

      fetchProfile();

      unsubscribeSnapshot = onSnapshot(doc(db, 'users', user.id), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.isDisabled) {
            auth.signOut();
            alert("Your account has been disabled by an administrator.");
            setProfile(null);
            setUser(null);
          } else {
            setProfile({ id: docSnap.id, ...data });
          }
        }
      });
    }
    
    return () => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

