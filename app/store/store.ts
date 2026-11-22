import { configureStore } from "@reduxjs/toolkit";
import configSlice from './configSlince'
import notificationsSlice from './NotificationsSlice'
import modelsSlince from './modelsSlince'

const store = configureStore({
    reducer: {
        config: configSlice,
        notifications: notificationsSlice,
        models: modelsSlince
    }
})

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;