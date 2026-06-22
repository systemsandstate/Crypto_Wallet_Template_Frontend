import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Platform } from 'react-native';
import { Merchant, setAuthToken } from '../services/api';
import { getStoredAvatarUrl, setStoredAvatarUrl } from '../utils/avatarStorage';

interface AuthState {
  merchant: Merchant | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  avatarUrl: string | null;
}

const initialState: AuthState = {
  merchant: null,
  accessToken: null,
  isAuthenticated: false,
  avatarUrl: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ merchant: Merchant; accessToken: string }>
    ) => {
      state.merchant = action.payload.merchant;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.avatarUrl =
        Platform.OS === 'web' ? getStoredAvatarUrl(action.payload.merchant.id) : null;
      setAuthToken(action.payload.accessToken);
    },
    setAvatarUrl: (
      state,
      action: PayloadAction<{ merchantId: string; avatarUrl: string | null }>
    ) => {
      state.avatarUrl = action.payload.avatarUrl;
      setStoredAvatarUrl(action.payload.merchantId, action.payload.avatarUrl);
    },
    logout: (state) => {
      state.merchant = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.avatarUrl = null;
      setAuthToken(null);
    },
  },
});

export const { setCredentials, setAvatarUrl, logout } = authSlice.actions;
export default authSlice.reducer;
