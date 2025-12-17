export enum LookupTypeName {
  EYES = 'EYES',
  HAIR = 'HAIR',
  ID_TYPE = 'ID TYPE',
  RACE = 'RACE',
  REFERRED = 'REFERRED',
  TENDER = 'TENDER',
  ACTION = 'ACTION',
  BARREL = 'BARREL',
  CALIBER = 'CALIBER',
  FINISH = 'FINISH',
  IMPORTER = 'IMPORTER',
  CLARITY = 'CLARITY',
  COLOR = 'COLOR',
  SHAPE = 'SHAPE',
  TYPE = 'TYPE',
  GENDER = 'GENDER',
  KARAT = 'KARAT',
  METAL = 'METAL',
  SIZE = 'SIZE',
  STYLE = 'STYLE',
  BODY_STYLE = 'BODY STYLE',
  CONDITION = 'CONDITION',
}

export interface LookupOption {
  id: string;
  value: string;
}
