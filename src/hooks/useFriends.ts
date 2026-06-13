import { useEffect, useState } from 'react';
import { listenFriends } from '../api/friends';
import { useProfile } from '../context/AuthContext';
import { UserProfile } from '../types/models';

export function useFriends(): UserProfile[] {
  const profile = useProfile();
  const [friends, setFriends] = useState<UserProfile[]>([]);
  useEffect(() => listenFriends(profile.uid, setFriends), [profile.uid]);
  return friends;
}
