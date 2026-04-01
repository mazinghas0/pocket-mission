import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBudIcC1zrKzgY8m5k58lvEF30C6u024ZA",
  authDomain: "pocket-mission.firebaseapp.com",
  projectId: "pocket-mission",
  storageBucket: "pocket-mission.firebasestorage.app",
  messagingSenderId: "203814836932",
  appId: "1:203814836932:web:ad008fab80add75d6e8791",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const templates = [
  { title: '방 청소하기', description: '방을 깨끗이 청소하고 사진으로 인증해요', defaultPoints: 30, category: '청소' },
  { title: '설거지 하기', description: '식사 후 설거지를 도와주세요', defaultPoints: 20, category: '청소' },
  { title: '화장실 청소', description: '화장실을 깨끗이 청소해요', defaultPoints: 40, category: '청소' },
  { title: '책 1권 읽기', description: '책을 읽고 간단한 독후감을 써주세요', defaultPoints: 50, category: '학습' },
  { title: '수학 문제 풀기', description: '수학 문제집 1페이지를 풀어요', defaultPoints: 30, category: '학습' },
  { title: '영어 단어 외우기', description: '영어 단어 10개를 외우고 테스트해요', defaultPoints: 30, category: '학습' },
  { title: '30분 운동하기', description: '줄넘기, 조깅 등 30분 운동을 해요', defaultPoints: 40, category: '건강' },
  { title: '심부름 하기', description: '마트나 편의점 심부름을 해요', defaultPoints: 30, category: '가사' },
  { title: '빨래 개기', description: '건조된 빨래를 정리해서 개어요', defaultPoints: 25, category: '가사' },
  { title: '쓰레기 버리기', description: '분리수거 포함 쓰레기를 버려요', defaultPoints: 20, category: '가사' },
];

async function seed() {
  console.log('미션 템플릿 시드 시작...');
  for (const template of templates) {
    const ref = await addDoc(collection(db, 'mission_templates'), template);
    console.log(`추가됨: ${template.title} (${ref.id})`);
  }
  console.log('완료!');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
