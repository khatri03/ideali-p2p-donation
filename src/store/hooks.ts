import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

export const useAppDispatch = () => useDispatch<AppDispatch>(); //returns typed dispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
