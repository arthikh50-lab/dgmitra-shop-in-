import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged } from './firebaseAuth';
import { supabase } from './supabase';

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
    let channel: any;
    
    if (user) {
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('uid', user.id)
          .single();
          
        if (data) {
          if (data.isDisabled) {
            await auth.signOut();
            alert("Your account has been disabled by an administrator.");
            setProfile(null);
            setUser(null);
          } else {
            setProfile(data);
          }
        } else if (error && error.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert([
              { uid: user.id, email: user.email, role: 'user' }
            ])
            .select()
            .single();
            
          if (!insertError && newProfile) {
            setProfile(newProfile);
          }
        }
        setLoading(false);
      };

      fetchProfile();

      channel = supabase
        .channel(`public:users:uid=eq.${user.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `uid=eq.${user.id}` }, (payload) => {
          if (payload.new.isDisabled) {
            auth.signOut();
            alert("Your account has been disabled by an administrator.");
            setProfile(null);
            setUser(null);
          } else {
            setProfile(payload.new);
          }
        })
        .subscribe();
    }
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

