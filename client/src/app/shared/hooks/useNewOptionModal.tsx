import { useState } from "react";
import NewOptionModal from "../components/NewOptionModal";

export const useNewOptionModal = (handleConfirmAdd: any, title: string) => {
    const [showAddModal, setShowAddModal] = useState(false);

    const NewOptionModalWrapper = () => {
        return (
            <NewOptionModal
                open={showAddModal}
                onCancel={() => setShowAddModal(false)}
                onConfirm={handleConfirmAdd}
                title={`Add new ${title}`}
                message="Enter the description for the new option."
                confirmText="Add"
            />
        )
    };

    return {
        NewOptionModalWrapper,
        showAddModal,
        setShowAddModal
    }
}