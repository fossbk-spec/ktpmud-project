export const DISPLAY_MODES=[{value:'small',label:'Nhỏ'},{value:'medium',label:'Vừa'},{value:'large',label:'Lớn'}];
export const normalizeDisplayMode=value=>DISPLAY_MODES.some(m=>m.value===value)?value:'medium';
export const DISPLAY_STORAGE_KEY='farm-display-mode';
