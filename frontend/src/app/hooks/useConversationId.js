const { create } = require("zustand");

const useConversationId = create((set) => ({
    convId: "",
    tokensLeft: null,
    setConvId: (id, tk) => {
        set({ convId: id, tokensLeft: tk })
    }
}));

export default useConversationId;