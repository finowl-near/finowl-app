const { create } = require("zustand");

const useConversationId = create((set) => ({
    convId: "",
    setConvId: (id) => {
        set({ convId: id })
    }
}));

export default useConversationId;