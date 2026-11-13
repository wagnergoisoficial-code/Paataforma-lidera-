import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, doc, setDoc, getDoc, updateDoc, collection, 
  addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, 
  Firestore, where, getDocs, getDocFromServer, Timestamp,
  startAfter, increment, arrayUnion, deleteDoc
} from 'firebase/firestore';
import { 
  getAuth, Auth, GoogleAuthProvider, signInWithPopup, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  signOut, onAuthStateChanged 
} from 'firebase/auth';
import { 
  getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage 
} from 'firebase/storage';
import { User, UserRole, AgendaEvent, Devotional, Community, Post, Notification as AppNotification, NotificationType, Comment, Ritual, Challenge, LeaderInsight, Discipleship, CheckIn, Presence, TimelineEvent, LeaderTask, CommunityStats, Network, Plan, GlobalChallenge, Hymn, Transaction, Encouragement, ChatRoom, ChatMessage } from '../types';
import firebaseConfig from '../firebase-applet-config.json';

export class FirebaseService {
  static instance: FirebaseService;
  db: Firestore | null = null;
  app: FirebaseApp | null = null;
  auth: Auth | null = null;
  storage: FirebaseStorage | null = null;
  currentUser: User | null = null;
  private likedPostsCache: Set<string> = new Set();
  private likedCommentsCache: Map<string, Set<string>> = new Map(); // postId -> Set of commentIds

  constructor() {
    this.checkLocalSession();
    console.log("Initializing FirebaseService...");
    try {
      const apps = getApps();
      if (apps.length > 0) {
        console.log("Using existing Firebase app");
        this.app = apps[0];
      } else {
        console.log("Initializing new Firebase app with config:", { ...firebaseConfig, apiKey: '***' });
        this.app = initializeApp(firebaseConfig);
      }
      
      if (this.app) {
        this.db = getFirestore(this.app, firebaseConfig.firestoreDatabaseId || '(default)');
        this.auth = getAuth(this.app);
        this.storage = getStorage(this.app);
        console.log("Firebase services initialized successfully");
        this.testConnection();
      } else {
        console.error("Failed to initialize Firebase app: app is null");
      }
    } catch (e) { 
      console.error("Firebase init error:", e);
    }
  }

  async testConnection() {
    if (!this.db) return;
    try {
      await getDocFromServer(doc(this.db, 'test', 'connection'));
    } catch (error) {
      if(error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration. The client is offline.");
      }
    }
  }

  static getInstance() {
    if (!FirebaseService.instance) FirebaseService.instance = new FirebaseService();
    return FirebaseService.instance;
  }

  checkLocalSession() {
    try {
      const saved = localStorage.getItem('umadw_user_data');
      if (saved) this.currentUser = JSON.parse(saved);
    } catch (e) { localStorage.removeItem('umadw_user_data'); }
  }

  async getUserProfile(uid: string) {
    if (!this.db) return null;
    try {
      const userRef = doc(this.db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return { uid: snap.id, ...snap.data() } as User;
      }
      return null;
    } catch (e) {
      this.handleFirestoreError(e, 'get', 'users/' + uid);
      return null;
    }
  }

  async saveUserProfile(user: User) {
    try {
      this.currentUser = user;
      localStorage.setItem('umadw_user_data', JSON.stringify(user));
      if (this.db && user.uid) {
        const userRef = doc(this.db, 'users', user.uid);
        await setDoc(userRef, { ...user, lastSeen: serverTimestamp() }, { merge: true });
      }
    } catch (e) { 
      this.handleFirestoreError(e, 'write', 'users/' + user.uid);
    }
  }

  handleFirestoreError(error: any, operationType: string, path: string | null) {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: this.auth?.currentUser?.uid,
        email: this.auth?.currentUser?.email,
        emailVerified: this.auth?.currentUser?.emailVerified,
        isAnonymous: this.auth?.currentUser?.isAnonymous,
        tenantId: this.auth?.currentUser?.tenantId,
        providerInfo: this.auth?.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }

  // --- NOTIFICATIONS ---

  async requestNotificationPermission() {
    if (!this.auth || !this.auth.currentUser || !this.db) return;
    
    try {
      let permission = 'default';
      if ('Notification' in window) {
        permission = await Notification.requestPermission();
      }
      
      if (permission === 'granted') {
        // In a real environment with a service worker and VAPID key:
        // const messaging = getMessaging(this.app);
        // const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
        
        // For this environment, we simulate the token or use a placeholder
        const mockToken = `fcm_token_${this.auth.currentUser.uid}_${Date.now()}`;
        
        await updateDoc(doc(this.db, 'users', this.auth.currentUser.uid), {
          fcmToken: mockToken
        });
        
        console.log('FCM Token registered:', mockToken);
        return mockToken;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }

  async createNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) {
    if (!this.db) return;
    try {
      const notificationData: any = {
        ...notification,
        read: false,
        timestamp: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(this.db, 'notifications'), notificationData);
      
      // Simulate sending FCM Push
      console.log(`[FCM PUSH] To: ${notification.targetUid} | Title: ${notification.title} | Body: ${notification.body}`);
      
      return docRef.id;
    } catch (error) {
      this.handleFirestoreError(error, 'write', 'notifications');
    }
  }

  subscribeNotifications(callback: (notifications: AppNotification[]) => void) {
    if (!this.auth || !this.auth.currentUser || !this.db) return () => {};

    const q = query(
      collection(this.db, 'notifications'),
      where('targetUid', '==', this.auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppNotification[];
      callback(notifications);
    }, (error) => {
      console.error('Error subscribing to notifications:', error);
    });
  }

  async markNotificationAsRead(notificationId: string) {
    if (!this.db) return;
    try {
      await updateDoc(doc(this.db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async notifyCommunity(communityId: string, notification: Omit<AppNotification, 'id' | 'timestamp' | 'read' | 'targetUid'>) {
    if (!this.db) return;
    try {
      // Fetch all users in the community
      const q = query(collection(this.db, 'users'), where('communityId', '==', communityId));
      const snapshot = await getDocs(q);
      
      const promises = snapshot.docs.map(userDoc => {
        // Don't notify the sender
        if (userDoc.id === this.auth?.currentUser?.uid) return Promise.resolve();
        
        return this.createNotification({
          ...notification,
          targetUid: userDoc.id
        });
      });
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error notifying community:', error);
    }
  }

  getCurrentUser() { return this.currentUser; }
  
  getAuthInstance() { return this.auth; }

  onAuthChange(callback: (user: User | null) => void) {
    if (!this.auth) return;
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        if (this.db) {
          try {
            const userRef = doc(this.db, 'users', firebaseUser.uid);
            const snapshot = await getDoc(userRef);
            
            if (snapshot.exists()) {
              this.currentUser = snapshot.data() as User;
              this.currentUser.uid = firebaseUser.uid; 
              if (!this.currentUser.communityId) this.currentUser.communityId = 'umadw';
              
              const isOwnerEmail = firebaseUser.email === "wagnergoisoficial@gmail.com";
              if (isOwnerEmail && this.currentUser.role !== 'Dono' && this.currentUser.role !== 'SuperAdmin') {
                this.currentUser.role = 'Dono';
              }
              
              // Update lastSeen and loginCount
              const userRef = doc(this.db, 'users', firebaseUser.uid);
              await updateDoc(userRef, { 
                lastSeen: serverTimestamp(),
                loginCount: increment(1),
                ...(isOwnerEmail && (snapshot.data()?.role !== 'Dono' && snapshot.data()?.role !== 'SuperAdmin') ? { role: 'Dono' } : {})
              });

              localStorage.setItem('umadw_user_data', JSON.stringify(this.currentUser));
              callback(this.currentUser);
            } else {
              const isAdminEmail = firebaseUser.email === "wagnergoisoficial@gmail.com";
              const newUser: User = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                email: firebaseUser.email,
                birthday: '01/01',
                role: (isAdminEmail ? 'Dono' : 'Membro') as UserRole,
                photo: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || firebaseUser.email.split('@')[0])}&background=FDB813&color=001220&size=150`,
                communityId: 'umadw',
                level: 1,
                experience: 0,
                streak: 0,
                badges: [],
                contributions: {
                  posts: 0,
                  comments: 0,
                  likes: 0,
                  ritualsCompleted: 0
                }
              };
              await this.saveUserProfile(newUser);
              callback(newUser);
            }
          } catch (error) {
            this.handleFirestoreError(error, 'get', 'users/' + firebaseUser.uid);
          }
        } else {
          const basicUser: User = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            email: firebaseUser.email,
            birthday: '01/01',
            role: 'Membro' as UserRole,
            photo: firebaseUser.photoURL || '',
            communityId: 'umadw',
            level: 1,
            experience: 0,
            streak: 0,
            badges: [],
            contributions: {
              posts: 0,
              comments: 0,
              likes: 0,
              ritualsCompleted: 0
            }
          };
          callback(basicUser);
        }
      } else {
        this.currentUser = null;
        localStorage.removeItem('umadw_user_data');
        callback(null);
      }
    });
  }

  async getCommunity(communityId: string): Promise<Community | null> {
    if (!this.db) return null;
    try {
      const commRef = doc(this.db, 'communities', communityId);
      const snapshot = await getDoc(commRef);
      return snapshot.exists() ? snapshot.data() as Community : null;
    } catch (e) {
      this.handleFirestoreError(e, 'get', 'communities/' + communityId);
      return null;
    }
  }

  async logout() {
    if (this.auth) await signOut(this.auth);
    localStorage.removeItem('umadw_user_data');
    this.currentUser = null;
    window.location.reload();
  }

  async getMembers(limitCount: number = 50) {
    if (!this.db || !this.currentUser) return [];
    const communityId = this.currentUser.communityId;
    const q = query(
      collection(this.db, 'users'),
      where('communityId', '==', communityId),
      orderBy('name', 'asc'),
      limit(limitCount)
    );

    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
    } catch (e) {
      this.handleFirestoreError(e, 'list', 'users');
      return [];
    }
  }

  subscribeAllMembers(callback: (users: User[]) => void) {
    if (!this.db || !this.currentUser) return () => {};
    const communityId = this.currentUser.communityId;
    const usersRef = query(
      collection(this.db, 'users'), 
      where('communityId', '==', communityId),
      limit(20)
    );
    return onSnapshot(usersRef, (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((doc) => { 
        users.push({ uid: doc.id, ...doc.data() } as User); 
      }); 
      callback(users);
    }, (error) => {
      this.handleFirestoreError(error, 'list', 'users');
    });
  }

  subscribeCommunityMembers(callback: (users: User[]) => void, limitCount: number = 200) {
    if (!this.db || !this.currentUser) return () => {};
    const communityId = this.currentUser.communityId;
    const usersRef = query(
      collection(this.db, 'users'), 
      where('communityId', '==', communityId),
      limit(limitCount)
    );
    return onSnapshot(usersRef, (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((doc) => { 
        users.push({ uid: doc.id, ...doc.data() } as User); 
      }); 
      // Sort alphabetically by name on client
      users.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      callback(users);
    }, (error) => {
      this.handleFirestoreError(error, 'list', 'users');
    });
  }

  async updateMemberRecord(uid: string, data: Partial<User>) {
    if (!this.db) return;
    try {
      const userRef = doc(this.db, 'users', uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      this.handleFirestoreError(e, 'update', 'users/' + uid);
    }
  }

  async createMemberRecord(memberData: Partial<User>) {
    if (!this.db || !this.currentUser) return;
    try {
      const communityId = this.currentUser.communityId || 'umadw';
      const cleanName = memberData.name?.trim() || 'Novo Membro';
      const cleanEmail = memberData.email?.trim() || `membro_${Date.now()}@umadw.com`;
      const cleanRole = memberData.role || 'Membro';
      const photo = memberData.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=FDB813&color=001220&size=150`;
      
      const newDocRef = doc(collection(this.db, 'users'));
      const newMember: User = {
        uid: newDocRef.id,
        name: cleanName,
        email: cleanEmail,
        birthday: memberData.birthday || '01/01',
        role: cleanRole as any,
        status: memberData.status || 'Ativo',
        phone: memberData.phone || '',
        address: memberData.address || '',
        baptismDate: memberData.baptismDate || '',
        notes: memberData.notes || '',
        photo,
        communityId,
        level: 1,
        experience: 0,
        streak: 0,
        badges: [],
        contributions: {
          posts: 0,
          comments: 0,
          likes: 0,
          ritualsCompleted: 0
        }
      };

      await setDoc(newDocRef, {
        ...newMember,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp()
      });

      return newDocRef.id;
    } catch (e) {
      this.handleFirestoreError(e, 'write', 'users');
    }
  }


  async createFeedPost(postData: Partial<Post> & { mediaFile?: File }) {
    try {
      if (!this.db || !this.currentUser) return null;
      const communityId = this.currentUser.communityId || 'umadw';
      const postsRef = collection(this.db, 'communities', communityId, 'posts');
      
      const isLeader = ['Dono', 'Lider', 'Admin', 'leader', 'regente', 'tesoureiro', 'secretaria', 'admin'].includes(this.currentUser.role);

      let mediaUrl = postData.mediaUrl || '';
      if (postData.mediaFile) {
        const storageRef = ref(this.storage, `communities/${communityId}/posts/${Date.now()}_${postData.mediaFile.name}`);
        await uploadBytes(storageRef, postData.mediaFile);
        mediaUrl = await getDownloadURL(storageRef);
      }

      const { mediaFile, ...restData } = postData;

      const finalPost = {
        type: 'normal',
        pinned: false,
        priority: 0,
        authorName: this.currentUser.name,
        authorPhoto: this.currentUser.photo,
        authorUid: this.currentUser.uid,
        isLeaderPost: isLeader,
        likeCount: 0,
        commentCount: 0,
        communityId,
        timestamp: serverTimestamp(),
        ...restData,
        mediaUrl
      };

      const docRef = await addDoc(postsRef, finalPost);
      await this.trackInteraction();
      return docRef.id;
    } catch (e) {
      this.handleFirestoreError(e, 'write', 'communities/' + (this.currentUser?.communityId || 'umadw') + '/posts');
      return null;
    }
  }

  async publishDevotional(devotionalData: Devotional) {
      try {
          if (!this.db || !this.currentUser) return;
          const communityId = this.currentUser.communityId;
          const devocionaisRef = collection(this.db, 'communities', communityId, 'devocionais');
          const docRef = await addDoc(devocionaisRef, { 
              ...devotionalData, 
              timestamp: serverTimestamp(),
              communityId,
              data_postagem: new Date().toLocaleDateString('pt-BR')
          });

          // Auto-post to feed
          const postRef = await this.createFeedPost({
            type: 'devotional',
            pinned: true,
            priority: 100, // Max priority
            caption: `🙏 Novo Devocional: ${devotionalData.titulo}\n\n${devotionalData.referencia_biblica}`,
            metadata: { devotionalId: docRef.id }
          });

          // Notify community
          if (postRef) {
            await this.notifyCommunity(communityId, {
              type: 'devotional',
              title: '📖 Novo Devocional!',
              body: devotionalData.titulo,
              relatedId: postRef,
              senderName: 'Portal UMADW',
            });
          }
      } catch (e) { 
        this.handleFirestoreError(e, 'write', 'communities/' + (this.currentUser?.communityId || 'umadw') + '/devocionais');
      }
  }

  subscribeLatestDevotional(callback: (devotional: Devotional | null) => void) {
      if (!this.db || !this.currentUser) return () => {};
      const communityId = this.currentUser.communityId;
      const devRef = query(
        collection(this.db, 'communities', communityId, 'devocionais'), 
        orderBy('timestamp', 'desc'), 
        limit(1)
      );
      return onSnapshot(devRef, (snapshot) => {
          if (!snapshot.empty) {
              const latest = snapshot.docs[0].data() as Devotional;
              callback(latest);
          } else {
              callback(null);
          }
      }, (error) => {
        this.handleFirestoreError(error, 'get', 'communities/' + communityId + '/devocionais');
      });
  }

  async publishEvent(eventData: AgendaEvent) {
      try {
          if (!this.db || !this.currentUser) return;
          const communityId = this.currentUser.communityId;
          const eventsRef = collection(this.db, 'communities', communityId, 'agenda_events');
          const docRef = await addDoc(eventsRef, { ...eventData, communityId, createdAt: serverTimestamp() });

          // Auto-post to feed
          const postRef = await this.createFeedPost({
            type: 'event',
            pinned: false,
            priority: 50,
            caption: `📅 Novo Evento: ${eventData.title}\n\nData: ${new Date(eventData.start).toLocaleDateString('pt-BR')}\n${eventData.description || ''}`,
            metadata: { 
              eventId: docRef.id,
              eventDate: eventData.start
            }
          });

          // Notify community
          if (postRef) {
            await this.notifyCommunity(communityId, {
              type: 'event',
              title: '📅 Novo Evento!',
              body: eventData.title,
              relatedId: postRef,
              senderName: 'Portal UMADW',
            });
          }
      } catch (e) { 
        this.handleFirestoreError(e, 'write', 'communities/' + (this.currentUser?.communityId || 'umadw') + '/agenda_events');
      }
  }

  subscribeEvents(callback: (events: AgendaEvent[]) => void) {
      if (!this.db || !this.currentUser) return () => {};
      const communityId = this.currentUser.communityId;
      const eventsRef = collection(this.db, 'communities', communityId, 'agenda_events');
      return onSnapshot(eventsRef, (snapshot) => {
          const events: AgendaEvent[] = [];
          snapshot.forEach((doc) => {
              const val = doc.data();
              events.push({
                  id: doc.id,
                  title: val.title,
                  start: val.start,
                  description: val.description,
                  color: val.color || '#FDB813',
                  allDay: val.allDay || false
              } as AgendaEvent);
          });
          callback(events);
      }, (error) => {
        this.handleFirestoreError(error, 'list', 'communities/' + communityId + '/agenda_events');
      });
  }

  async publishPost(postData: Partial<Post>) {
    await this.createFeedPost(postData);
  }

  async uploadFile(file: File, path: string): Promise<string> {
    if (!this.storage) throw new Error("Storage not initialized");
    const storageRef = ref(this.storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  }

  async shareVerse(verse: string, reference: string) {
    await this.createFeedPost({
      type: 'verse',
      caption: `📖 "${verse}"\n\n— ${reference}`,
      metadata: { verseReference: reference }
    });
  }

  async postEncouragement() {
    const messages = [
      "Deus é o seu refúgio e fortaleza, socorro bem presente na angústia. (Salmos 46:1)",
      "Não fui eu que lhe ordenei? Seja forte e corajoso! (Josué 1:9)",
      "O Senhor é o meu pastor; de nada terei falta. (Salmos 23:1)",
      "Tudo posso naquele que me fortalece. (Filipenses 4:13)",
      "Pois eu sei os planos que tenho para vocês, diz o Senhor. (Jeremias 29:11)"
    ];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    
    const postRef = await this.createFeedPost({
      type: 'encouragement',
      caption: `✨ Boca de Deus para você hoje:\n\n${randomMsg}`,
      priority: 30,
      authorName: 'UMADW',
      authorPhoto: 'https://ui-avatars.com/api/?name=UMADW&background=001220&color=FDB813'
    });

    if (postRef && this.currentUser) {
      await this.notifyCommunity(this.currentUser.communityId, {
        type: 'encouragement',
        title: '✨ Mensagem de Encorajamento',
        body: randomMsg,
        relatedId: postRef,
        senderName: 'Portal UMADW',
      });
    }
  }

  subscribePosts(callback: (posts: Post[]) => void, limitCount: number = 20) {
    if (!this.db || !this.currentUser) return () => {};
    const communityId = this.currentUser.communityId;
    
    const q = query(
      collection(this.db, 'communities', communityId, 'posts'), 
      orderBy('pinned', 'desc'),
      orderBy('priority', 'desc'),
      orderBy('isLeaderPost', 'desc'),
      orderBy('timestamp', 'desc'), 
      limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
      const posts: Post[] = [];
      snapshot.forEach((doc) => {
        posts.push({ id: doc.id, ...doc.data() } as Post);
      });
      callback(posts);
    }, (error) => {
      this.handleFirestoreError(error, 'list', 'communities/' + communityId + '/posts');
    });
  }

  async getPostsPaginated(lastVisible: any = null, pageSize: number = 10) {
    if (!this.db || !this.currentUser) return { posts: [], lastVisible: null };
    const communityId = this.currentUser.communityId;
    
    try {
      let q = query(
        collection(this.db, 'communities', communityId, 'posts'), 
        orderBy('pinned', 'desc'),
        orderBy('priority', 'desc'),
        orderBy('isLeaderPost', 'desc'),
        orderBy('timestamp', 'desc'), 
        limit(pageSize)
      );

      if (lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const snapshot = await getDocs(q);
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      const last = snapshot.docs[snapshot.docs.length - 1];

      return { posts, lastVisible: last };
    } catch (e) {
      this.handleFirestoreError(e, 'list', 'communities/' + communityId + '/posts');
      return { posts: [], lastVisible: null };
    }
  }

  async toggleLike(postId: string, userId: string) {
    if (!this.db || !this.currentUser) return;
    try {
      const communityId = this.currentUser.communityId || 'umadw';
      const postRef = doc(this.db, 'communities', communityId, 'posts', postId);
      const likeRef = doc(this.db, 'communities', communityId, 'posts', postId, 'likes', userId);
      
      const likeSnap = await getDoc(likeRef);
      const isLiking = !likeSnap.exists();
      
      if (isLiking) {
        await setDoc(likeRef, { timestamp: serverTimestamp() });
        await updateDoc(postRef, { likeCount: increment(1) });
        this.likedPostsCache.add(postId);
        
        // Notify author
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
          const post = postSnap.data();
          if (post.authorUid !== this.auth?.currentUser?.uid) {
            await this.createNotification({
              type: 'like',
              title: '❤️ Nova curtida!',
              body: `${this.currentUser?.name || 'Alguém'} curtiu seu post.`,
              targetUid: post.authorUid,
              senderUid: this.auth?.currentUser?.uid,
              senderName: this.currentUser?.name,
              senderPhoto: this.currentUser?.photo,
              relatedId: postId
            });
          }
        }
      } else {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likeCount: increment(-1) });
        this.likedPostsCache.delete(postId);
      }
      
      await this.trackInteraction();
    } catch (e) {
      this.handleFirestoreError(e, 'update', 'communities/' + (this.currentUser?.communityId || 'umadw') + '/posts/' + postId);
    }
  }

  async getLikedPostIds(postIds: string[]): Promise<Set<string>> {
    if (!this.db || !this.currentUser || postIds.length === 0) return new Set();
    const userId = this.currentUser.uid;
    const communityId = this.currentUser.communityId || 'umadw';

    try {
      // Filter out already cached IDs
      const uncachedIds = postIds.filter(id => !this.likedPostsCache.has(id));
      
      if (uncachedIds.length > 0) {
        // Check each post's likes subcollection for the current user
        // We do this in parallel for efficiency
        await Promise.all(uncachedIds.map(async (postId) => {
          const likeRef = doc(this.db!, 'communities', communityId, 'posts', postId, 'likes', userId);
          const snap = await getDoc(likeRef);
          if (snap.exists()) {
            this.likedPostsCache.add(postId);
          }
        }));
      }
      
      // Return only the ones from the requested list that are in the cache
      const result = new Set<string>();
      postIds.forEach(id => {
        if (this.likedPostsCache.has(id)) result.add(id);
      });
      return result;
    } catch {
      return new Set();
    }
  }

  async getBirthdaysToday() {
    if (!this.db || !this.currentUser) return [];
    const communityId = this.currentUser.communityId;
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const todayStr = `${day}/${month}`;

    const q = query(
      collection(this.db, 'users'),
      where('communityId', '==', communityId),
      where('birthday', '==', todayStr),
      limit(20)
    );

    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
    } catch (e) {
      this.handleFirestoreError(e, 'list', 'users');
      return [];
    }
  }

  async addComment(postId: string, text: string) {
    if (!this.db || !this.currentUser) return;
    try {
      const communityId = this.currentUser.communityId || 'umadw';
      const postRef = doc(this.db, 'communities', communityId, 'posts', postId);
      const commentsRef = collection(postRef, 'comments');

      const commentData: Comment = {
        postId,
        userName: this.currentUser.name,
        userPhoto: this.currentUser.photo,
        userUid: this.currentUser.uid,
        text,
        timestamp: serverTimestamp(),
        likeCount: 0
      };

      await addDoc(commentsRef, commentData);
      await this.trackInteraction();
      
      // Atomic increment of comment count
      await updateDoc(postRef, { 
        commentCount: increment(1) 
      });

      // Fetch post to notify author
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const post = postSnap.data() as Post;
        if (post.authorUid !== this.auth?.currentUser?.uid) {
          await this.createNotification({
            type: 'comment',
            title: '💬 Novo comentário!',
            body: `${this.currentUser?.name || 'Alguém'} comentou no seu post: "${text.substring(0, 30)}..."`,
            targetUid: post.authorUid,
            senderUid: this.auth?.currentUser?.uid,
            senderName: this.currentUser?.name,
            senderPhoto: this.currentUser?.photo,
            relatedId: postId
          });
        }
      }
    } catch (e) {
      this.handleFirestoreError(e, 'write', 'communities/' + (this.currentUser?.communityId || 'umadw') + '/posts/' + postId + '/comments');
    }
  }

  subscribeComments(postId: string, callback: (comments: Comment[]) => void) {
    if (!this.db || !this.currentUser) return () => {};
    const communityId = this.currentUser.communityId || 'umadw';
    const commentsRef = query(
      collection(this.db, 'communities', communityId, 'posts', postId, 'comments'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    return onSnapshot(commentsRef, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      callback(comments);
    }, (error) => {
      this.handleFirestoreError(error, 'list', 'communities/' + communityId + '/posts/' + postId + '/comments');
    });
  }

  async toggleCommentLike(postId: string, commentId: string, userId: string) {
    if (!this.db || !this.currentUser) return;
    const communityId = this.currentUser.communityId || 'umadw';
    const commentRef = doc(this.db, 'communities', communityId, 'posts', postId, 'comments', commentId);
    const likeRef = doc(commentRef, 'likes', userId);

    try {
      const likeSnap = await getDoc(likeRef);
      const isLiking = !likeSnap.exists();

      if (isLiking) {
        await setDoc(likeRef, { timestamp: serverTimestamp() });
        await updateDoc(commentRef, { likeCount: increment(1) });
        
        // Update cache
        if (!this.likedCommentsCache.has(postId)) {
          this.likedCommentsCache.set(postId, new Set());
        }
        this.likedCommentsCache.get(postId)!.add(commentId);
      } else {
        await deleteDoc(likeRef);
        await updateDoc(commentRef, { likeCount: increment(-1) });
        
        // Update cache
        if (this.likedCommentsCache.has(postId)) {
          this.likedCommentsCache.get(postId)!.delete(commentId);
        }
      }
    } catch (e) {
      this.handleFirestoreError(e, 'write', 'communities/' + communityId + '/posts/' + postId + '/comments/' + commentId + '/likes');
    }
  }

  async getLikedCommentIds(postId: string, commentIds: string[]) {
    if (!this.db || !this.currentUser || commentIds.length === 0) return new Set<string>();
    const communityId = this.currentUser.communityId || 'umadw';
    
    // Initialize cache for this post if not exists
    if (!this.likedCommentsCache.has(postId)) {
      this.likedCommentsCache.set(postId, new Set());
    }
    
    const postCache = this.likedCommentsCache.get(postId)!;
    const uncachedIds = commentIds.filter(id => !postCache.has(id));
    
    if (uncachedIds.length > 0) {
      try {
        const promises = uncachedIds.map(async (commentId) => {
          const likeRef = doc(this.db!, 'communities', communityId, 'posts', postId, 'comments', commentId, 'likes', this.currentUser!.uid);
          const snap = await getDoc(likeRef);
          if (snap.exists()) postCache.add(commentId);
        });

        await Promise.all(promises);
      } catch (e) {
        console.error("Error fetching liked comments:", e);
      }
    }
    
    // Return only the ones requested that are in cache
    return new Set(commentIds.filter(id => postCache.has(id)));
  }

  async checkBirthdays() {
    if (!this.db || !this.currentUser) return;
    
    // Only admins or leaders should trigger the global check to avoid redundant notifications
    const isPrivileged = ['Admin', 'Lider', 'Dono'].includes(this.currentUser.role);
    if (!isPrivileged) return;

    try {
      const today = new Date();
      const dayMonth = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}`;
      
      const q = query(collection(this.db, 'users'), where('communityId', '==', this.currentUser.communityId));
      const snapshot = await getDocs(q);
      
      const birthdayUsers = snapshot.docs.filter(doc => {
        const userData = doc.data();
        // Assuming birthday format is DD/MM/YYYY
        return userData.birthday && userData.birthday.startsWith(dayMonth);
      });

      for (const userDoc of birthdayUsers) {
        const userData = userDoc.data();
        
        // Check if we already notified today for this user (to avoid duplicates)
        // In a real app, we'd store a 'lastBirthdayNotify' field
        
        await this.notifyCommunity(this.currentUser.communityId, {
          type: 'birthday',
          title: '🎂 Aniversariante do Dia!',
          body: `Hoje é o aniversário de ${userData.name}! Vamos parabenizar?`,
          senderName: 'Portal UMADW',
          relatedId: userDoc.id
        });
      }
    } catch (error) {
      console.error('Error checking birthdays:', error);
    }
  }

  async updateCommunitySettings(communityId: string, settings: Partial<Community>) {
    if (!this.db) return;
    try {
      const commRef = doc(this.db, 'communities', communityId);
      await setDoc(commRef, settings, { merge: true });
    } catch (e) {
      this.handleFirestoreError(e, 'update', 'communities/' + communityId);
    }
  }

  // --- ENGAGEMENT & INTELLIGENCE ---

  async trackInteraction(xp: number = 10, type: TimelineEvent['type'] = 'contribution', title: string = 'Interação na comunidade', description: string = 'Você interagiu com a comunidade.') {
    if (!this.db || !this.currentUser || !this.auth?.currentUser) return;
    try {
      const userRef = doc(this.db, 'users', this.auth.currentUser.uid);
      
      // Calculate streak
      let newStreak = this.currentUser.streak || 0;
      const now = new Date();
      const lastUpdate = this.currentUser.lastStreakUpdate ? (this.currentUser.lastStreakUpdate as Timestamp).toDate() : null;
      
      if (lastUpdate) {
        const diffDays = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
 
      // Calculate level
      const oldLevel = this.currentUser.level || 1;
      const newExp = (this.currentUser.experience || 0) + xp;
      const newLevel = Math.floor(Math.sqrt(newExp / 100)) + 1;
 
      // Parallelize non-critical updates
      const promises: Promise<any>[] = [];

      promises.push(updateDoc(userRef, {
        lastInteraction: serverTimestamp(),
        interactionCount: increment(1),
        experience: newExp,
        level: newLevel,
        streak: newStreak,
        lastStreakUpdate: serverTimestamp()
      }));
 
      // Record Timeline Event
      promises.push(this.addTimelineEvent({
        userUid: this.currentUser.uid!,
        type,
        title,
        description,
        impactScore: xp,
        communityId: this.currentUser.communityId,
        timestamp: serverTimestamp()
      }));

      // Level up milestone
      if (newLevel > oldLevel) {
        promises.push(this.addTimelineEvent({
          userUid: this.currentUser.uid!,
          type: 'milestone',
          title: `Nível ${newLevel} Alcançado! 🚀`,
          description: `Parabéns! Você evoluiu para o nível ${newLevel}.`,
          impactScore: 50,
          communityId: this.currentUser.communityId,
          timestamp: serverTimestamp()
        }));
      }

      // Update community stats
      const communityRef = doc(this.db, 'communities', this.currentUser.communityId);
      promises.push(setDoc(communityRef, {
        stats: { totalInteractions: increment(1) }
      }, { merge: true }));

      await Promise.all(promises);

      // Update local state
      this.currentUser.experience = newExp;
      this.currentUser.level = newLevel;
      this.currentUser.streak = newStreak;
      localStorage.setItem('umadw_user_data', JSON.stringify(this.currentUser));
    } catch (e) {
      console.error("Error tracking interaction:", e);
    }
  }

  // --- RITUALS ---

  async getActiveRituals() {
    if (!this.db || !this.currentUser) return [];
    const q = query(
      collection(this.db, 'communities', this.currentUser.communityId, 'rituals'),
      where('active', '==', true)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Ritual));
  }

  async completeRitual(ritualId: string, xp: number) {
    if (!this.db || !this.currentUser) return;
    await this.trackInteraction(xp, 'ritual', 'Ritual Completado', 'Você completou um ritual da comunidade.');
    
    // Update user's ritual count
    const userRef = doc(this.db, 'users', this.currentUser.uid!);
    await updateDoc(userRef, {
      'contributions.ritualsCompleted': increment(1)
    });
  }

  async createRitual(ritual: Omit<Ritual, 'id' | 'timestamp'>) {
    if (!this.db) return;
    return await addDoc(collection(this.db, 'communities', ritual.communityId, 'rituals'), {
      ...ritual,
      timestamp: serverTimestamp()
    });
  }

  // --- CHALLENGES ---

  async getChallenges() {
    if (!this.db || !this.currentUser) return [];
    const q = query(
      collection(this.db, 'communities', this.currentUser.communityId, 'challenges'),
      orderBy('endDate', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Challenge));
  }

  async joinChallenge(challengeId: string) {
    if (!this.db || !this.currentUser) return;
    const challengeRef = doc(this.db, 'communities', this.currentUser.communityId, 'challenges', challengeId);
    await updateDoc(challengeRef, {
      participants: arrayUnion(this.currentUser.uid)
    });
  }

  // --- INSIGHTS ---

  async getInsights() {
    if (!this.db || !this.currentUser) return [];
    const q = query(
      collection(this.db, 'communities', this.currentUser.communityId, 'insights'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as LeaderInsight));
  }

  async saveInsight(insight: Omit<LeaderInsight, 'id' | 'timestamp'>) {
    if (!this.db) return;
    return await addDoc(collection(this.db, 'communities', insight.communityId, 'insights'), {
      ...insight,
      timestamp: serverTimestamp()
    });
  }

  // --- COMMUNITY MANAGEMENT ---

  async getCommunityMembers() {
    if (!this.db || !this.currentUser) return [];
    const q = query(
      collection(this.db, 'users'),
      where('communityId', '==', this.currentUser.communityId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ uid: d.id, ...d.data() } as User));
  }

  async getInactiveUsers(days: number = 7) {
    if (!this.db || !this.currentUser) return [];
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - days);
    
    const q = query(
      collection(this.db, 'users'),
      where('communityId', '==', this.currentUser.communityId),
      where('lastInteraction', '<', Timestamp.fromDate(threshold))
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ uid: d.id, ...d.data() } as User));
  }

  async getCommunityStats(communityId?: string) {
    if (!this.db) return null;
    const cid = communityId || this.currentUser?.communityId || 'umadw';
    const docRef = doc(this.db, 'communities', cid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        totalMembers: data.totalMembers || 0,
        totalInteractions: data.totalInteractions || 0,
        totalPosts: data.stats?.totalPosts || 0,
        totalComments: data.stats?.totalComments || 0,
        activeUsers7d: data.stats?.activeUsers7d || 0
      } as CommunityStats;
    }
    return null;
  }

  // --- DISCIPLESHIP ---

  async createDiscipleship(discipleship: Omit<Discipleship, 'id' | 'startDate'>) {
    if (!this.db) return;
    return await addDoc(collection(this.db, 'communities', discipleship.communityId, 'discipleships'), {
      ...discipleship,
      startDate: serverTimestamp()
    });
  }

  // --- EXPANSION & MONETIZATION ---

  async createCommunity(data: Omit<Community, 'id' | 'createdAt'>, templateId: string = 'default') {
    if (!this.db || !this.auth?.currentUser) throw new Error("Not authenticated");
    
    try {
      const communityRef = doc(collection(this.db, 'communities'));
      const communityId = communityRef.id;
      
      const newCommunity: Community = {
        ...data,
        id: communityId,
        createdAt: serverTimestamp(),
        subscriptionStatus: 'Ativo',
        planId: data.planId || 'free',
        leaderUid: this.auth.currentUser.uid,
        settings: {
          allowGlobalRanking: true,
          allowInterCommunityEvents: true,
          maxMembers: data.planId === 'premium' ? 500 : 100,
          features: data.planId === 'premium' ? ['ai_insights', 'global_ranking'] : []
        }
      };

      await setDoc(communityRef, newCommunity);

      // Apply Template
      await this.applyTemplate(communityId, templateId);

      // Update user role to 'Dono' and link to community
      await updateDoc(doc(this.db, 'users', this.auth.currentUser.uid), {
        communityId,
        role: 'Dono'
      });

      return communityId;
    } catch (e) {
      this.handleFirestoreError(e, 'write', 'communities');
    }
  }

  private async applyTemplate(communityId: string, templateId: string) {
    if (!this.db) return;

    const rituals: Omit<Ritual, 'id' | 'timestamp'>[] = [
      {
        title: 'Devocional Diário',
        description: 'Leia a palavra e compartilhe seu aprendizado.',
        type: 'daily',
        actionType: 'post',
        xpReward: 50,
        active: true,
        communityId
      },
      {
        title: 'Oração em Unidade',
        description: 'Participe do clamor da comunidade.',
        type: 'daily',
        actionType: 'prayer',
        xpReward: 30,
        active: true,
        communityId
      }
    ];

    for (const ritual of rituals) {
      await addDoc(collection(this.db, 'communities', communityId, 'rituals'), {
        ...ritual,
        timestamp: serverTimestamp()
      });
    }

    // Add initial challenge
    await addDoc(collection(this.db, 'communities', communityId, 'challenges'), {
      title: 'Primeiros Passos',
      description: 'Complete seus primeiros 7 dias de devocional.',
      startDate: serverTimestamp(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      targetGoal: 7,
      currentProgress: 0,
      participants: [],
      communityId,
      timestamp: serverTimestamp()
    });
  }

  async getGlobalRanking(limitCount: number = 10) {
    if (!this.db) return [];
    try {
      // Query users across all communities ordered by experience
      const q = query(
        collection(this.db, 'users'),
        orderBy('experience', 'desc'),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ uid: d.id, ...d.data() } as User));
    } catch (e) {
      this.handleFirestoreError(e, 'list', 'users_global');
      return [];
    }
  }

  async getNetworkData(networkId: string) {
    if (!this.db) return null;
    try {
      const snap = await getDoc(doc(this.db, 'networks', networkId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Network;
      }
      return null;
    } catch (e) {
      this.handleFirestoreError(e, 'get', 'networks/' + networkId);
      return null;
    }
  }

  async getDiscipleship(userUid: string) {
    if (!this.db || !this.currentUser) return null;
    const q = query(
      collection(this.db, 'communities', this.currentUser.communityId, 'discipleships'),
      where('menteeUid', '==', userUid),
      where('status', '==', 'active'),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      // Check if user is a mentor
      const q2 = query(
        collection(this.db, 'communities', this.currentUser.communityId, 'discipleships'),
        where('mentorUid', '==', userUid),
        where('status', '==', 'active')
      );
      const snap2 = await getDocs(q2);
      return snap2.docs.map(d => ({ id: d.id, ...d.data() } as Discipleship));
    }
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Discipleship;
  }

  // --- CHECK-INS ---

  async addCheckIn(checkIn: Omit<CheckIn, 'id' | 'timestamp'>) {
    if (!this.db) return;
    const docRef = await addDoc(collection(this.db, 'communities', checkIn.communityId, 'checkins'), {
      ...checkIn,
      timestamp: serverTimestamp()
    });
    
    await this.addTimelineEvent({
      userUid: checkIn.userUid,
      type: 'ritual',
      title: `Check-in ${checkIn.type === 'emotional' ? 'Emocional' : 'Espiritual'}`,
      description: `Você realizou seu check-in. Mood: ${checkIn.mood || 'N/A'}`,
      impactScore: 20,
      communityId: checkIn.communityId,
      timestamp: serverTimestamp(),
      relatedId: docRef.id
    });

    return docRef.id;
  }

  async getCheckIns(userUid: string) {
    if (!this.db || !this.currentUser) return [];
    const q = query(
      collection(this.db, 'communities', this.currentUser.communityId, 'checkins'),
      where('userUid', '==', userUid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CheckIn));
  }

  // --- PRESENCE ---

  async recordPresence(presence: Omit<Presence, 'id' | 'timestamp'>) {
    if (!this.db) return;
    const docRef = await addDoc(collection(this.db, 'communities', presence.communityId, 'presences'), {
      ...presence,
      timestamp: serverTimestamp()
    });

    await this.addTimelineEvent({
      userUid: presence.userUid,
      type: 'presence',
      title: `Presença em: ${presence.eventTitle}`,
      description: `Participação confirmada no evento.`,
      impactScore: 100,
      communityId: presence.communityId,
      timestamp: serverTimestamp(),
      relatedId: docRef.id
    });

    return docRef.id;
  }

  async getEventPresence(eventId: string) {
    if (!this.db || !this.currentUser) return [];
    const q = query(
      collection(this.db, 'communities', this.currentUser.communityId, 'presences'),
      where('eventId', '==', eventId),
      orderBy('timestamp', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Presence));
  }

  // --- TIMELINE ---

  async addTimelineEvent(event: Omit<TimelineEvent, 'id'>) {
    if (!this.db || !this.currentUser) return;
    return await addDoc(collection(this.db, 'communities', event.communityId, 'timeline'), {
      ...event,
      userName: event.userName || this.currentUser.name,
      userPhoto: event.userPhoto || this.currentUser.photo,
      timestamp: event.timestamp || serverTimestamp()
    });
  }

  async getTimeline(userUid: string) {
    if (!this.db || !this.currentUser) return [];
    const q = query(
      collection(this.db, 'communities', this.currentUser.communityId, 'timeline'),
      where('userUid', '==', userUid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as TimelineEvent));
  }

  // --- LEADER TASKS ---

  async createLeaderTask(task: Omit<LeaderTask, 'id' | 'timestamp'>) {
    if (!this.db) return;
    return await addDoc(collection(this.db, 'communities', task.communityId, 'leader_tasks'), {
      ...task,
      timestamp: serverTimestamp()
    });
  }

  async getLeaderTasks(leaderUid: string) {
    if (!this.db || !this.currentUser) return [];
    const q = query(
      collection(this.db, 'communities', this.currentUser.communityId, 'leader_tasks'),
      where('leaderUid', '==', leaderUid),
      where('status', '==', 'pending'),
      orderBy('priority', 'desc'),
      orderBy('dueDate', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as LeaderTask));
  }

  async updateLeaderTaskStatus(taskId: string, status: LeaderTask['status']) {
    if (!this.db || !this.currentUser) return;
    const taskRef = doc(this.db, 'communities', this.currentUser.communityId, 'leader_tasks', taskId);
    await updateDoc(taskRef, { status });
  }

  async publishInternalPost(postData: Partial<Post>, options: { toFeed?: boolean, toChatRoomId?: string } = {}) {
    if (!this.db || !this.currentUser) return null;
    const communityId = this.currentUser.communityId;
    const postsRef = collection(this.db, 'communities', communityId, 'internal_posts');
    
    const finalPost = {
      ...postData,
      authorName: this.currentUser.name,
      authorPhoto: this.currentUser.photo,
      authorUid: this.currentUser.uid,
      isLeaderPost: true,
      communityId,
      timestamp: serverTimestamp()
    };

    const docRef = await addDoc(postsRef, finalPost);
    
    if (options.toFeed) {
      await this.createFeedPost({
        ...postData,
        isLeaderPost: true,
        priority: 100,
        metadata: { internalPostId: docRef.id }
      });
    }
    
    if (options.toChatRoomId) {
      const message = `📢 Comunicado da Liderança:\n\n"${postData.caption?.substring(0, 200)}${postData.caption && postData.caption.length > 200 ? '...' : ''}"`;
      await this.sendChatMessage(options.toChatRoomId, message);
    }

    return docRef.id;
  }

  async sharePostToChat(postId: string, roomId: string) {
    if (!this.db || !this.currentUser) return;
    const communityId = this.currentUser.communityId;
    
    // Fetch post data
    const postRef = doc(this.db, 'communities', communityId, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) return;
    const post = postSnap.data() as Post;
    
    const message = `📢 Compartilhou um post:\n\n"${post.caption.substring(0, 100)}${post.caption.length > 100 ? '...' : ''}"\n\nLink: /post/${postId}`;
    
    await this.sendChatMessage(roomId, message);
  }

  async sendReengagementNotification(targetUid: string, name: string) {
    await this.createNotification({
      type: 'encouragement',
      title: 'Sentimos sua falta! ❤️',
      body: `Olá ${name}, faz tempo que não te vemos por aqui. Que tal conferir as novidades da comunidade?`,
      targetUid,
      senderUid: 'system',
      senderName: 'Sistema UMADW',
    });
  }

  // --- HYMNS (REGENTE) ---

  async publishHymn(hymn: Omit<Hymn, 'id' | 'timestamp'>) {
    if (!this.db || !this.currentUser) return;
    const communityId = this.currentUser.communityId;
    const hymnsRef = collection(this.db, 'communities', communityId, 'hymns');
    const docRef = await addDoc(hymnsRef, {
      ...hymn,
      timestamp: serverTimestamp()
    });

    // Auto-post to feed
    await this.createFeedPost({
      type: 'normal',
      caption: `🎵 Novo Hino Adicionado: ${hymn.title}\n\n${hymn.lyrics.substring(0, 100)}...`,
      metadata: { hymnId: docRef.id }
    });

    return docRef.id;
  }

  async getHymns() {
    if (!this.db || !this.currentUser) return [];
    const q = query(
      collection(this.db, 'communities', this.currentUser.communityId, 'hymns'),
      orderBy('timestamp', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Hymn));
  }

  // --- TRANSACTIONS (TESOURARIA) ---

  async addTransaction(transaction: Omit<Transaction, 'id' | 'timestamp'>) {
    if (!this.db || !this.currentUser) return;
    const communityId = this.currentUser.communityId;
    const transRef = collection(this.db, 'communities', communityId, 'transactions');
    return await addDoc(transRef, {
      ...transaction,
      timestamp: serverTimestamp()
    });
  }

  async getTransactions() {
    if (!this.db || !this.currentUser) return [];
    const q = query(
      collection(this.db, 'communities', this.currentUser.communityId, 'transactions'),
      orderBy('date', 'desc'),
      orderBy('timestamp', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
  }

  // --- ENCOURAGEMENTS (BOCA DE DEUS) ---

  async sendEncouragement(encouragement: Omit<Encouragement, 'id' | 'timestamp'>) {
    if (!this.db || !this.currentUser) return;
    const communityId = this.currentUser.communityId;
    const encRef = collection(this.db, 'communities', communityId, 'encouragements');
    const docRef = await addDoc(encRef, {
      ...encouragement,
      timestamp: serverTimestamp()
    });

    // Notify recipient
    await this.createNotification({
      type: 'encouragement',
      title: '✨ Nova mensagem da Boca de Deus!',
      body: encouragement.isAnonymous ? 'Você recebeu uma mensagem anônima de encorajamento.' : `${this.currentUser.name} te enviou uma mensagem de encorajamento.`,
      targetUid: encouragement.toUid,
      senderUid: encouragement.isAnonymous ? 'anonymous' : this.currentUser.uid,
      senderName: encouragement.isAnonymous ? 'Anônimo' : this.currentUser.name,
      relatedId: docRef.id
    });

    return docRef.id;
  }

  async getMyEncouragements() {
    if (!this.db || !this.currentUser) return [];
    const q = query(
      collection(this.db, 'communities', this.currentUser.communityId, 'encouragements'),
      where('toUid', '==', this.currentUser.uid),
      orderBy('timestamp', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Encouragement));
  }

  // --- CHAT ---

  async getOrCreateCommunityGroupChat() {
    if (!this.db || !this.currentUser) return null;
    const communityId = this.currentUser.communityId;
    const roomsRef = collection(this.db, 'communities', communityId, 'chat_rooms');
    
    // Check if community group chat already exists
    const q = query(roomsRef, where('type', '==', 'group'), where('isCommunityGroup', '==', true));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      const doc = snap.docs[0];
      return { id: doc.id, ...doc.data() } as ChatRoom;
    }

    // Create new community group room
    const newRoom: Omit<ChatRoom, 'id' | 'timestamp'> = {
      participants: [], // Empty means everyone in community can join/see
      type: 'group',
      communityId,
      lastMessage: '',
      isCommunityGroup: true,
      name: 'Chat da Comunidade'
    };
    const docRef = await addDoc(roomsRef, { ...newRoom, timestamp: serverTimestamp() });
    return { id: docRef.id, ...newRoom } as ChatRoom;
  }

  async getOrCreateChatRoom(participants: string[]) {
    if (!this.db || !this.currentUser) return null;
    const communityId = this.currentUser.communityId;
    const roomsRef = collection(this.db, 'communities', communityId, 'chat_rooms');
    
    // For 1-on-1 chats, check if room already exists
    if (participants.length === 2) {
      const q = query(roomsRef, where('participants', 'array-contains', participants[0]));
      const snap = await getDocs(q);
      const existing = snap.docs.find(d => {
        const data = d.data();
        return data.participants.length === 2 && data.participants.includes(participants[1]);
      });
      if (existing) return { id: existing.id, ...existing.data() } as ChatRoom;
    }

    // Create new room
    const newRoom: Omit<ChatRoom, 'id' | 'timestamp'> = {
      participants,
      type: participants.length > 2 ? 'group' : 'private',
      communityId,
      lastMessage: ''
    };
    const docRef = await addDoc(roomsRef, { ...newRoom, timestamp: serverTimestamp() });
    return { id: docRef.id, ...newRoom } as ChatRoom;
  }

  async sendChatMessage(roomId: string, text: string) {
    if (!this.db || !this.currentUser) return;
    const communityId = this.currentUser.communityId;
    const messagesRef = collection(this.db, 'communities', communityId, 'chat_rooms', roomId, 'messages');
    const roomRef = doc(this.db, 'communities', communityId, 'chat_rooms', roomId);

    await addDoc(messagesRef, {
      roomId,
      senderUid: this.currentUser.uid,
      senderName: this.currentUser.name,
      text,
      timestamp: serverTimestamp()
    });

    await updateDoc(roomRef, {
      lastMessage: text,
      lastMessageTime: serverTimestamp()
    });
  }

  subscribeMyChatRooms(callback: (rooms: ChatRoom[]) => void) {
    if (!this.db || !this.currentUser) return () => {};
    const communityId = this.currentUser.communityId;
    const q = query(
      collection(this.db, 'communities', communityId, 'chat_rooms'),
      where('participants', 'array-contains', this.currentUser.uid),
      orderBy('lastMessageTime', 'desc'),
      limit(20)
    );
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatRoom)));
    });
  }

  subscribeChatMessages(roomId: string, callback: (messages: ChatMessage[]) => void) {
    if (!this.db || !this.currentUser) return () => {};
    const communityId = this.currentUser.communityId;
    const q = query(
      collection(this.db, 'communities', communityId, 'chat_rooms', roomId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
    });
  }
}

export const firebaseService = FirebaseService.getInstance();
