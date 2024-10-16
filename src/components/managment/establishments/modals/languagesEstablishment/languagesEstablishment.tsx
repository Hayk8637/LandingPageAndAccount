import { Button, Checkbox, Modal } from 'antd'
import React, { useEffect, useState } from 'react'
import { ILanguage, ILanguages } from '../../../../../interfaces/interfaces';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../../firebaseConfig';

interface ILanguagesEstablishmentProps {
    isModalVisible: boolean;
    onCancel: () => void;
    selectedLanguages: ILanguages;
    selectedEstablishmentId: any;
    userId: any;
}
const LanguagesEstablishment:React.FC<ILanguagesEstablishmentProps> = ({isModalVisible , onCancel , selectedLanguages , selectedEstablishmentId , userId}) => {
  useEffect(() => {
    setSelectedLanguages(selectedLanguages);
  }, [selectedLanguages]);
  const [selectedLanguagesNow, setSelectedLanguages] = useState({
        am: selectedLanguages.am,
        en: selectedLanguages.en,
        ru: selectedLanguages.ru,
      });
    
    const handleUpdateLanguages = async (establishmentId: any, language: ILanguage) => {
        const checkedLanguages = Object.values(selectedLanguages).filter(Boolean).length;
        if (checkedLanguages === 1 && selectedLanguages[language]) {
          return;
        }
        setSelectedLanguages((prevState) => {
          const updatedLanguages = {
            ...prevState,
            [language]: !prevState[language],
          };
      
          if (userId && establishmentId) {
            const showImgRef = doc(db, 'users', userId, 'establishments', establishmentId);
            updateDoc(showImgRef, {
              languages: updatedLanguages,
            })
              .then(() => {
              })
              .catch((error) => {
                console.error("Error updating languages in Firestore:", error);
              });
          }
      
          return updatedLanguages;
        });
      };



  return (
    <Modal title="Languages Establishment" open={isModalVisible} onCancel={onCancel} footer={null}>
        <Checkbox
          checked={selectedLanguagesNow.am}
          onChange={() => handleUpdateLanguages(selectedEstablishmentId , 'am') }
        >
          Armenian (AM)
        </Checkbox>
        <Checkbox
          checked={selectedLanguagesNow.en}
          onChange={() => handleUpdateLanguages(selectedEstablishmentId , 'en')}
        >
          English (EN)
        </Checkbox>
        <Checkbox
          checked={selectedLanguagesNow.ru}
          onChange={() => handleUpdateLanguages(selectedEstablishmentId , 'ru')}
        >
          Russian (RU)
        </Checkbox>
        <Button style={{ marginTop: '10px', width: '100%' }} onClick={onCancel}>
          Cancel
        </Button>
      </Modal>
  )
}

export default LanguagesEstablishment
