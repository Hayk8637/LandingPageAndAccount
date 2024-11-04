import { getAuth, onAuthStateChanged } from 'firebase/auth'; 
import React, { useEffect, useState, useRef } from 'react';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { InputRef } from 'antd';
import { Flex, Input, Tag, Tooltip, message, Button, Modal } from 'antd';
import { IEstablishmentStyles, ILanguage } from '../../../../interfaces/interfaces';
import { useLocation } from 'react-router-dom';
import i18n from '../../../../translations/i18n';
import styles from './style.module.css';
import { db } from '../../../../firebaseConfig';
import { doc, updateDoc, getDoc, deleteField } from 'firebase/firestore';

const SubCategory: React.FC = () => {
const pathname = useLocation().pathname || '';
const establishmentId = pathname.split('/')[pathname.split('/').length - 2];
const categoryId = pathname.split('/')[pathname.split('/').length - 1];
const [establishmentStyles, setEstablishmentStyles] = useState<IEstablishmentStyles>();
const [userId, setUserId] = useState<string | null>(null);
const [currentLanguage, setCurrentLanguage] = useState<ILanguage>('en');
const [tags, setTags] = useState<Array<{ id: string; name: Record<string, string> }>>([]);
const [inputVisible, setInputVisible] = useState(false);
const [inputValue, setInputValue] = useState('');
const [editInputIndex, setEditInputIndex] = useState(-1);
const [editInputValue, setEditInputValue] = useState('');
const inputRef = useRef<InputRef>(null);
const editInputRef = useRef<InputRef>(null);
const tagInputStyle: React.CSSProperties = {
  width: 'auto',
  marginInlineEnd: 8,
  verticalAlign: 'top',
  padding: '5px 10px',
  background: 'none',
  borderStyle: 'dashed',
  border: `1px solid #${establishmentStyles?.color2}`,
  color: `#${establishmentStyles?.color2}`,
};

useEffect(() => {
  const savedLanguage = localStorage.getItem('menuLanguage');
  if (savedLanguage === 'en' || savedLanguage === 'am' || savedLanguage === 'ru') {
    setCurrentLanguage(savedLanguage);
  } else {
    localStorage.setItem('menuLanguage', 'en');
  }
}, []);

useEffect(() => {
  const auth = getAuth();
  const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    setUserId(user ? user.uid : null);
  });
  const savedLanguage = localStorage.getItem('language');
  if (savedLanguage && i18n?.changeLanguage) {
    i18n.changeLanguage(savedLanguage);
  }
  return () => unsubscribeAuth();
}, []);

useEffect(() => {
  if (userId && establishmentId && categoryId) {
    const fetchSubCategories = async () => {
      try {
        const docRef = doc(db, 'users', userId, 'establishments', establishmentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const categories = docSnap.data()?.menu?.categories?.[categoryId]?.subCategories || {};
          setEstablishmentStyles(docSnap.data()?.styles);
          const sortedSubCategories = Object.keys(categories)
            .map((key) => ({ id: key, ...categories[key] }))
            .sort((a, b) => a.order - b.order);

          setTags(sortedSubCategories);
        } else {
          message.error('Failed to fetch subcategories');
        }
      } catch (error) {
        message.error('Error fetching subcategories');
      }
    };
    fetchSubCategories();
  }
}, [userId, establishmentId, categoryId]);

useEffect(() => {
  if (inputVisible) {
    inputRef.current?.focus();
  }
}, [inputVisible]);

useEffect(() => {
  editInputRef.current?.focus();
}, [editInputValue]);

const handleClose = (removedTagId: string) => {
  Modal.confirm({
    title: 'Are you sure you want to delete this subcategory?',
    okText: 'Yes',
    okType: 'danger',
    cancelText: 'No',
    onOk: async () => {
      const newTags = tags.filter((tag) => tag.id !== removedTagId);
      setTags(newTags);

      try {
        if (userId && establishmentId && categoryId) {
          const docRef = doc(db, 'users', userId, 'establishments', establishmentId);
          await updateDoc(docRef, {
            [`menu.categories.${categoryId}.subCategories.${removedTagId}`]: deleteField(),
          });
        }
      } catch (error) {
      }
    },
  });
};

const showInput = () => {
  setInputVisible(true);
};

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setInputValue(e.target.value);
};

const handleInputConfirm = async () => {
  if (inputValue.trim() === '') {
    return;
  }

  const uniqueSubCategoryId = Date.now().toString();
  const newTag = {
    id: uniqueSubCategoryId,
    name: {
      en: inputValue,
      am: inputValue,
      ru: inputValue,
    },
    order: tags.length,
  };
  const newTags = [...tags, newTag];
  setTags(newTags);

  try {
    if (userId && establishmentId && categoryId) {
      const docRef = doc(db, 'users', userId, 'establishments', establishmentId);
      await updateDoc(docRef, {
        [`menu.categories.${categoryId}.subCategories.${uniqueSubCategoryId}`]: newTag,
      });
    }
  } catch (error) {
  }
  setInputVisible(false);
  setInputValue('');
};

const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setEditInputValue(e.target.value);
};

const handleEditInputConfirm = async () => {
  if (editInputValue.trim() === '') {
    return;
  }
  const newTags = [...tags];
  newTags[editInputIndex].name[currentLanguage] = editInputValue;
  setTags(newTags);

  try {
    if (userId && establishmentId && categoryId) {
      const docRef = doc(db, 'users', userId, 'establishments', establishmentId);
      await updateDoc(docRef, {
        [`menu.categories.${categoryId}.subCategories.${newTags[editInputIndex].id}.name.${currentLanguage}`]: editInputValue,
      });
    }
  } catch (error) {
  }

  setEditInputIndex(-1);
  setEditInputValue('');
};

const tagPlusStyle: React.CSSProperties = {
  background: 'none',
  borderStyle: 'dashed',
  padding: '5px 10px',
  width: 'auto',
  border: `1px solid #${establishmentStyles?.color2}`,
  color: `#${establishmentStyles?.color2}`,
};

return (
  <div className={styles.subCategory}>
      <Flex wrap className={styles.flex}>
        {tags.map<React.ReactNode>((tag, index) => {
          const tagName = tag.name[currentLanguage];
          if (editInputIndex === index) {
            return (
              <Input
                ref={editInputRef}
                key={tag.id}
                size="large"
                style={tagInputStyle}
                value={editInputValue}
                onChange={handleEditInputChange}
                onBlur={handleEditInputConfirm}
                onPressEnter={handleEditInputConfirm}
                autoFocus />
            );
          }
          return (
            <Tooltip title={tagName} key={tag.id}>
              <Tag
                style={{  background: 'none', border: `1px solid #${establishmentStyles?.color2}`, color: `#${establishmentStyles?.color2}` }}
                onClick={() => {
                  setEditInputIndex(index);
                  setEditInputValue(tagName);
                }}
              >
                {tagName}
                <Button
                  type="primary"
                  onClick={() => handleClose(tag.id)}
                  style={{ marginLeft: '8px', padding: '8px', color: 'white', backgroundColor: '#ff7700'}}>
                  <DeleteOutlined style={{width: '14px' , fontSize: '14px'}} />
                </Button>
              </Tag>
            </Tooltip>
          );
        })}
        {inputVisible ? (
          <Input
            ref={inputRef}
            type="text"
            size="large"
            style={tagPlusStyle}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputConfirm}
            onPressEnter={handleInputConfirm}
            placeholder="Add new subcategory"
          />
        ) : (
          <Tag style={tagPlusStyle} onClick={showInput}>
            <PlusOutlined /> New Subcategory
          </Tag>
        )}
      </Flex>
  </div>
);
};

export default SubCategory;
