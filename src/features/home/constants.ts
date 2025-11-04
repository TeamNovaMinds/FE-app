import { Dimensions } from 'react-native';
import { TabName } from './types';

// 화면 높이/너비
export const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// 탭 배경 이미지
export const TAB_BACKGROUNDS = {
    fridge: require('../../../assets/images/fridge.png'),
    freezer: require('../../../assets/images/freezer.png'),
    room: require('../../../assets/images/room.png'),
};

// 탭 활성 색상
export const TAB_ACTIVE_COLORS = {
    fridge: '#5FE5FF',
    freezer: '#5FE5FF',
    room: '#FFAC5F',
};

// 저장 타입 매핑
export const STORAGE_TYPE_MAP: Record<TabName, string> = {
    fridge: 'REFRIGERATOR',
    freezer: 'FREEZER',
    room: 'ROOM_TEMPERATURE',
};