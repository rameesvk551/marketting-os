export type AutomationStatus = 'active' | 'draft';
export type TriggerScope = 'specific' | 'next' | 'any';
export type TriggerType = 'comment' | 'dm' | 'conversation_opener';
export type PreviewTab = 'post' | 'comments' | 'dm';
export type MessageBlockType = 'text' | 'button' | 'product_card' | 'product_catalog' | 'image' | 'cta';

export interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  ctaLabel: string;
  description?: string;
  url?: string;
}

export interface AutomationButton {
  label: string;
  url: string;
}

export interface MessageBlock {
  id: string;
  type: MessageBlockType;
  text?: string;
  label?: string;
  url?: string;
  imageUrl?: string;
  ctaLabel?: string;
  productId?: string;
}

export interface SendDmAction {
  type: 'send_dm';
  message: string;
  buttons: AutomationButton[];
  products: CatalogProduct[];
  blocks: MessageBlock[];
}

export interface InstagramAutomationSchema {
  id: string;
  name: string;
  trigger: {
    type: TriggerType;
    postId?: string;
    keywords: string[];
    scope: TriggerScope;
  };
  actions: SendDmAction[];
  status: AutomationStatus;
}

export interface KeywordEntry {
  value: string;
}

export interface AutomationBuilderFormValues {
  id: string;
  name: string;
  status: AutomationStatus;
  trigger: {
    type: TriggerType;
    scope: TriggerScope;
    postId: string;
    keywordFilterEnabled: boolean;
    keywords: KeywordEntry[];
  };
  optionalActions: {
    replyPublic: boolean;
    sendOpeningDm: boolean;
    requireFollow: boolean;
    collectEmail: boolean;
  };
  actions: [
    {
      type: 'send_dm';
      message: string;
      products: CatalogProduct[];
      blocks: MessageBlock[];
    },
  ];
}
