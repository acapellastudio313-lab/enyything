import { useState, useEffect, FormEvent, useRef, ChangeEvent } from 'react';
import { User, Post } from '../types';
import { Image as ImageIcon, X, Mic, Square, Trash2, Clock } from 'lucide-react';
import { db } from '../lib/firebase'; // Pastikan path ini benar
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import PostItem from '../components/PostItem';
import Stories from '../components/Stories';

export default function Home({ user }: { user: User }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [electionEndDate, setElectionEndDate] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);
  const [electionStatus, setElectionStatus] = useState<string>('not_started');

  // 1. REAL-TIME POSTS FROM FIRESTORE
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as unknown as Post[];
      setPosts(postsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. REAL-TIME ELECTION SETTINGS FROM FIRESTORE
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setElectionStatus(data.status || 'not_started');
        if (data.endDate) setElectionEndDate(new Date(data.endDate));
      }
    });
    return () => unsubscribe();
  }, []);

  // 3. COUNTDOWN TIMER LOGIC
  useEffect(() => {
    if (!electionEndDate || electionStatus !== 'in_progress') {
      setTimeLeft(null);
      return;
    }
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = electionEndDate.getTime() - now;
      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft(null);
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [electionEndDate, electionStatus]);

  // 4. HANDLE NEW POST (FIRESTORE)
  const handlePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() && !imageUrl && !audioUrl) return;

    try {
      await addDoc(collection(db, "posts"), {
        author_id: user.id,
        author_name: user.name,
        author_avatar: user.avatar,
        content: newPost,
        image_url: imageUrl || null,
        audio_url: audioUrl || null,
        likes: [],
        is_pinned: false,
        created_at: serverTimestamp()
      });

      setNewPost('');
      setImageUrl('');
      setShowImageInput(false);
      setAudioUrl(null);
    } catch (err) {
      console.error("Error adding post: ", err);
    }
  };

  // 5. HELPER FUNCTIONS
  const handleLike = async (postId: any) => {
    const postRef = doc(db, "posts", postId.toString());
    // Logika like Firestore (opsional, bisa disederhanakan)
  };

  const formatDuration = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest">Memuat Linimasa...</div>;

  return (
    <div className="w-full font-sans">
      {/* Banner Status Pemilihan (Real-time) */}
      <div className={`p-4 text-white transition-colors duration-500 ${electionStatus === 'in_progress' ? 'bg-emerald-600' : 'bg-slate-800'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <h2 className="font-black uppercase tracking-tight">Status Pemilihan</h2>
          </div>
          {electionEndDate && (
            <span className="text-[10px] bg-white/20 px-3 py-1 rounded-full font-bold uppercase">
              Deadline: {electionEndDate.toLocaleString('id-ID')}
            </span>
          )}
        </div>

        {electionStatus === 'not_started' && (
          <div className="text-center py-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
            <p className="font-black text-xl tracking-tighter uppercase">Pemilihan Belum Dimulai</p>
            <p className="text-xs opacity-60 mt-1 uppercase tracking-widest">Menunggu aktivasi dari administrator</p>
          </div>
        )}

        {electionStatus === 'in_progress' && timeLeft && (
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { val: timeLeft.days, label: 'Hari' },
              { val: timeLeft.hours, label: 'Jam' },
              { val: timeLeft.minutes, label: 'Menit' },
              { val: timeLeft.seconds, label: 'Detik' }
            ].map((t, i) => (
              <div key={i} className="bg-white/10 rounded-lg py-2 border border-white/5">
                <div className="text-2xl font-black leading-none">{t.val}</div>
                <div className="text-[8px] font-bold uppercase tracking-widest opacity-60 mt-1">{t.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Post Section */}
      <div className="p-4 border-b border-slate-100 bg-white shadow-sm">
        <form onSubmit={handlePost}>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Apa pendapat Anda?"
            className="w-full bg-transparent resize-none outline-none text-lg placeholder:text-slate-300 min-h-[80px]"
          />
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-4">
              <button type="button" onClick={() => setShowImageInput(!showImageInput)} className="text-slate-400 hover:text-emerald-500 transition-colors">
                <ImageIcon className="w-6 h-6" />
              </button>
              <button type="button" className="text-slate-400 hover:text-red-500 transition-colors">
                <Mic className="w-6 h-6" />
              </button>
            </div>
            <button
              type="submit"
              disabled={!newPost.trim() && !imageUrl}
              className="bg-black text-white px-8 py-2 rounded-full font-black text-xs uppercase tracking-widest hover:bg-slate-800 disabled:opacity-20 transition-all"
            >
              Posting
            </button>
          </div>
        </form>
      </div>

      {/* Feed (Real-time) */}
      <div className="bg-slate-50 min-h-screen">
        {posts.map((post) => (
          <PostItem key={post.id} post={post} user={user} onLike={handleLike} />
        ))}
      </div>
    </div>
  );
}