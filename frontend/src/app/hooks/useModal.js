const { create } = require("zustand");

const useModal = create((set) => ({
    isOpen: false,
    setModalOpen: (mo) => {
        set({ isOpen: mo })
    }
}));

export default useModal;