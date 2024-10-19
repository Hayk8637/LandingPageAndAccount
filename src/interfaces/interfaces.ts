export type ILanguage = 'am' | 'en' | 'ru';
export interface ILanguages {
  am: boolean;
  ru: boolean;
  en: boolean;
}
export interface IEstablishmentStyles {
  color1: string;
  color2: string;
  color3: string;
  color4: string;
  color5: string;
  showImg: boolean;
}
export interface IBannerImage {
  id: string;
  url: string;
}
export interface ICategory {
  id: string; 
  name: ITranslation;
}
export interface ITranslation {
  en: string,
  am: string,
  ru: string 
}
export interface IMenuCategoryItem {
  id: string;
  name: ITranslation
  imgUrl: string | null;
  isVisible: boolean;
  order: number;
}
export interface IMenuCategoryItems {
  id: string;
  name: ITranslation;
  description: ITranslation
  img: string | null;
  price: number;
  isVisible: boolean;
  order: number
}
export interface IInfoValues {
  wifiname: string;
  wifipass: string;
  address: string;
  currency: string;
  phone: string;
}
export interface IEstablishment {
    id?: string;
    styles: IEstablishmentStyles
    languages: ILanguages
    info: {
      name: string;
      wifiname?: string;
      wifipass?: string;
      phone?: string;
      address?: string;
      logoUrl: string;
      bannerUrls?: string[];
      currency?: string;
    };
    menu: {
      categories?: IMenuCategoryItem[];
      items?: IMenuCategoryItems[];
    };
    uid: string;
  }
  



  