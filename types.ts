export type UserRole = 'admin' | 'leader' | 'regente' | 'tesoureiro' | 'secretaria' | 'member' | 'Dono' | 'SuperAdmin' | 'Membro';

export interface Transaction {
  id?: string;
  type: 'entrada' | 'saida' | 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: any;
  communityId: string;
  createdBy: string;
  timestamp: any;
}

export interface Hymn {
  id?: string;
  title: string;
  number?: string;
  lyrics: string;
  youtubeUrl?: string;
  videoUrl?: string;
  category?: string;
  communityId: string;
  postedBy: string;
  timestamp: any;
}

export interface Encouragement {
  id?: string;
  text: string;
  message?: string;
  fromUid?: string; // Optional for anonymity
  fromName?: string; // Optional for anonymity
  toUid: string;
  isAnonymous: boolean;
  communityId: string;
  timestamp: any;
}

export interface ChatRoom {
  id: string;
  type: 'group' | 'private';
  name?: string;
  participants: string[]; // UIDs
  lastMessage?: string;
  lastMessageAt?: any;
  lastMessageTime?: any; // Added for consistency with firebaseService
  communityId: string;
  isCommunityGroup?: boolean;
}

export interface ChatMessage {
  id?: string;
  roomId: string;
  text: string;
  senderUid: string;
  senderName: string;
  senderPhoto?: string;
  timestamp: any;
  communityId: string;
}

export interface User {
  uid?: string;
  name: string;
  email: string;
  birthday: string;
  role: UserRole;
  photo: string;
  photoURL?: string; // Alias for photo
  bio?: string;
  communityId: string;
  networkId?: string; // Link to a network of communities
  status?: 'Ativo' | 'Inativo';
  phone?: string;
  address?: string;
  baptismDate?: string;
  notes?: string;
  fcmToken?: string;
  lastSeen?: any;
  lastInteraction?: any;
  interactionCount?: number;
  loginCount?: number;
  
  // Behavioral Identity
  level: number;
  experience: number;
  streak: number; // Consecutive days active
  lastStreakUpdate?: any;
  badges: string[];
  contributions: {
    posts: number;
    comments: number;
    likes: number;
    ritualsCompleted: number;
  };
}

export type NotificationType = 'devotional' | 'comment' | 'like' | 'birthday' | 'encouragement' | 'event' | 'ritual' | 'challenge' | 'insight';

export interface Notification {
  id?: string;
  type: NotificationType;
  title: string;
  body: string;
  targetUid: string; // Destinatário
  senderUid?: string; // Quem gerou a ação
  senderName?: string;
  senderPhoto?: string;
  relatedId?: string; // ID do post, evento, etc.
  read: boolean;
  timestamp: any;
}

export interface Community {
  id: string;
  name: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  leaderUid: string;
  planId: 'free' | 'premium' | 'enterprise';
  networkId?: string; // ID da rede/denominação
  subscriptionStatus: 'Ativo' | 'Vencido' | 'Bloqueado';
  leaderPin?: string; // Senha/PIN de acesso à área de liderança
  createdAt: any;
  settings?: {
    allowGlobalRanking: boolean;
    allowInterCommunityEvents: boolean;
    maxMembers: number;
    features: string[];
  };
  stats?: {
    totalMembers: number;
    totalPosts: number;
    totalComments: number;
    totalLikes: number;
    activeUsers7d: number;
  };
}

export interface Network {
  id: string;
  name: string;
  description: string;
  logo?: string;
  adminUid: string;
  communities: string[]; // IDs das comunidades
  createdAt: any;
}

export interface Plan {
  id: 'free' | 'premium' | 'enterprise';
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  limits: {
    maxMembers: number;
    maxStorageGB: number;
    maxAdmins: number;
  };
  features: string[]; // e.g., ['ai_insights', 'global_ranking', 'custom_branding']
}

export interface GlobalChallenge {
  id?: string;
  title: string;
  description: string;
  startDate: any;
  endDate: any;
  targetGoal: number;
  currentProgress: number;
  participatingCommunities: string[]; // IDs das comunidades
  rewardBadge?: string;
  networkId?: string;
  timestamp: any;
}

export type PostType = 'normal' | 'devotional' | 'event' | 'announcement' | 'verse' | 'encouragement';

export interface Comment {
  id?: string;
  postId: string;
  userName: string;
  userPhoto?: string;
  userUid: string;
  text: string;
  timestamp: any;
  likeCount?: number;
}

export interface Post {
  id: string;
  type: PostType;
  pinned: boolean;
  priority: number;
  authorName: string;
  authorPhoto: string;
  authorUid: string;
  isLeaderPost: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  caption: string;
  metadata?: {
    eventId?: string;
    eventDate?: string;
    devotionalId?: string;
    verseReference?: string;
    messageId?: string;
    discussionId?: string;
    hymnId?: string;
    internalPostId?: string;
  };
  likes?: string[]; // Deprecated: Use likeCount and subcollection
  likeCount: number;
  commentCount: number;
  timestamp: any;
  communityId: string;
}

export interface AgendaEvent {
  id?: string;
  title: string;
  start: string;
  description?: string;
  color?: string;
  allDay?: boolean;
  location?: string;
  youtubeLink?: string;
  communityId?: string;
}

export interface Devotional {
  id?: string;
  titulo: string;
  referencia_biblica: string;
  mensagem: string;
  texto?: string;
  autor?: string;
  imagem_url?: string;
  data_postagem?: string;
  timestamp?: any;
  communityId?: string;
}

export interface VerseOfTheDay {
  text: string;
  reference: string;
}

export interface Ritual {
  id?: string;
  type: 'daily' | 'weekly';
  title: string;
  description: string;
  actionType: 'read' | 'post' | 'comment' | 'prayer';
  xpReward: number;
  active: boolean;
  communityId: string;
  timestamp: any;
}

export interface CommunityStats {
  totalMembers: number;
  totalInteractions: number;
  totalPosts: number;
  totalComments: number;
  activeUsers7d: number;
}

export interface Discipleship {
  id?: string;
  mentorUid: string;
  mentorName?: string;
  mentorPhoto?: string;
  menteeUid: string;
  menteeName?: string;
  menteePhoto?: string;
  startDate: any;
  status: 'active' | 'completed' | 'paused';
  communityId: string;
  lastMeeting?: any;
  notes?: string;
}

export interface CheckIn {
  id?: string;
  userUid: string;
  type: 'emotional' | 'spiritual' | 'weekly';
  mood?: 'great' | 'good' | 'neutral' | 'bad' | 'struggling';
  status: string; // Text description
  timestamp: any;
  communityId: string;
  mentorFeedback?: string;
}

export interface Presence {
  id?: string;
  userUid: string;
  eventId: string;
  eventTitle: string;
  timestamp: any;
  communityId: string;
  verifiedBy?: string; // Leader UID
}

export interface TimelineEvent {
  id?: string;
  userUid: string;
  userName?: string;
  userPhoto?: string;
  type: 'achievement' | 'milestone' | 'contribution' | 'presence' | 'ritual';
  title: string;
  description: string;
  impactScore: number;
  timestamp: any;
  communityId: string;
  relatedId?: string;
}

export interface LeaderTask {
  id?: string;
  leaderUid: string;
  type: 'follow_up' | 'encouragement' | 'intervention' | 'celebration';
  targetUserUid: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'dismissed';
  priority: 'low' | 'medium' | 'high';
  dueDate: any;
  timestamp: any;
  communityId: string;
}

export interface Challenge {
  id?: string;
  title: string;
  description: string;
  startDate: any;
  endDate: any;
  targetGoal: number;
  currentProgress: number;
  participants: string[]; // UIDs
  rewardBadge?: string;
  communityId: string;
}

export interface LeaderInsight {
  id?: string;
  type: 'retention' | 'engagement' | 'growth';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  suggestedAction: string;
  targetUserUid?: string;
  timestamp: any;
  communityId: string;
}

export const PLAN_FEATURES = {
  free: {
    maxMembers: 50,
    allowGlobalRanking: false,
    allowInterCommunityEvents: false,
    advancedAnalytics: false,
    customBranding: false,
  },
  premium: {
    maxMembers: 500,
    allowGlobalRanking: true,
    allowInterCommunityEvents: true,
    advancedAnalytics: true,
    customBranding: true,
  },
  enterprise: {
    maxMembers: 5000,
    allowGlobalRanking: true,
    allowInterCommunityEvents: true,
    advancedAnalytics: true,
    customBranding: true,
  }
};

export type PlanType = keyof typeof PLAN_FEATURES;
