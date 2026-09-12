import type {
  DreamAnimal,
  DreamArticle,
  DreamOmen,
  DreamSituationId,
} from "@/lib/dreams/types";

export const DREAM_ANIMAL_OPTIONS: {
  id: DreamAnimal;
  label: string;
  short: string;
}[] = [
  { id: "dog", label: "강아지", short: "강아지" },
  { id: "cat", label: "고양이", short: "고양이" },
  { id: "rabbit", label: "토끼", short: "토끼" },
  { id: "hamster", label: "햄스터", short: "햄스터" },
  { id: "turtle", label: "거북이", short: "거북이" },
  { id: "bird", label: "새 (앵무·카나리아 등)", short: "새" },
  { id: "fish", label: "관상어", short: "물고기" },
  { id: "hedgehog", label: "고슴도치", short: "고슴도치" },
  { id: "other", label: "기타 반려동물", short: "반려동물" },
];

export const DREAM_SITUATION_OPTIONS: {
  id: DreamSituationId;
  label: string;
  hint: string;
}[] = [
  { id: "hug", label: "안아주는 꿈", hint: "품·무릎에 올려두는 장면" },
  { id: "runaway", label: "도망가는 꿈", hint: "쫓아가도 잡히지 않음" },
  { id: "hurt", label: "다치는 꿈", hint: "다치거나 아파 보임" },
  { id: "talk", label: "말을 하는 꿈", hint: "사람 말로 대화" },
  { id: "fly", label: "날아다니는 꿈", hint: "하늘·허공을 남" },
  { id: "dead", label: "죽은 아이가 나오는 꿈", hint: "이미 떠난 아이 등장" },
  { id: "bite", label: "무는 꿈", hint: "입질·물림" },
  { id: "cry", label: "우는 꿈", hint: "울음·하울링" },
  { id: "play", label: "신나게 노는 꿈", hint: "뛰어놀고 장난" },
  { id: "lost", label: "잃어버린 꿈", hint: "찾지 못함" },
  { id: "birth", label: "새끼를 낳는 꿈", hint: "출산·새끼" },
  { id: "eat", label: "맛있게 먹는 꿈", hint: "밥·간식" },
  { id: "bath", label: "목욕하는 꿈", hint: "씻기거나 물에 있음" },
  { id: "chase", label: "쫓아오는 꿈", hint: "뒤를 따라옴" },
  { id: "kiss", label: "핥아주거나 뽀뽀하는 꿈", hint: "애정 표현" },
];

export const DREAM_MOOD_OPTIONS = [
  "설렘",
  "불안",
  "슬픔",
  "평온",
  "그리움",
] as const;

const ANIMAL_KO: Record<DreamAnimal, string> = {
  dog: "강아지",
  cat: "고양이",
  rabbit: "토끼",
  hamster: "햄스터",
  turtle: "거북이",
  bird: "새",
  fish: "물고기",
  hedgehog: "고슴도치",
  other: "반려동물",
};

type Seed = {
  situationId: DreamSituationId;
  slugPart: string;
  titleVerb: string;
  omen: DreamOmen;
  summary: string;
  psychology: string;
  situations: { title: string; body: string }[];
  careTip: string;
};

const SEEDS: Seed[] = [
  {
    situationId: "fly",
    slugPart: "flying",
    titleVerb: "하늘을 날아가는",
    omen: "길몽",
    summary:
      "자유·해방·소망 성취의 상징으로 읽히는 경우가 많습니다. 보호자의 마음이 가벼워지거나, 아이에 대한 기대가 커질 때 자주 나타납니다.",
    psychology:
      "날아가는 장면은 무의식에서 ‘제약에서 벗어나고 싶다’는 바람, 혹은 ‘아이가 잘 자라길’ 바라는 투사로 해석됩니다. 현실에서 산책·놀이 시간이 부족했다면 보상 심리로 나오기도 합니다.",
    situations: [
      {
        title: "높이 멀리 날아갔다면?",
        body: "큰 변화·좋은 소식이 멀지 않았다는 길조로 보는 전통적 해석이 있습니다. 동시에 ‘놓칠까 봐’ 하는 불안이 섞여 있을 수 있어요.",
      },
      {
        title: "낮게·집 안만 맴돌았다면?",
        body: "일상의 작은 행복, 집 안에서의 유대감을 확인하는 꿈일 수 있습니다. 무리한 변화보다 지금 루틴을 다독이는 게 좋아요.",
      },
    ],
    careTip:
      "오늘 저녁은 평소보다 5~10분만 더 놀아 주세요. ‘날아갈 듯’ 신나는 놀이로 현실의 애착을 채워 주면 꿈의 메시지와 잘 맞습니다.",
  },
  {
    situationId: "dead",
    slugPart: "dead-appearance",
    titleVerb: "죽은 아이가 나오는",
    omen: "심리몽",
    summary:
      "공포의 흉몽이라기보다, 그리움·미련·돌봄 욕구가 꿈으로 나타난 경우가 많습니다. 작별하지 못한 마음이 남아 있을 때 자주 보입니다.",
    psychology:
      "이미 떠난 반려동물이 등장하는 꿈은 ‘아직 안녕을 고하지 못했다’는 애도의 과정일 수 있습니다. 살아 있는 아이를 키우는 중이라면, 건강 걱정이 과하게 쌓였다는 신호이기도 합니다.",
    situations: [
      {
        title: "평온하게 다가왔다면?",
        body: "이별의 아픔이 조금씩 녹고 있다는 따뜻한 신호로 읽히기도 합니다. 죄책감을 내려놓아도 된다는 마음의 허락일 수 있어요.",
      },
      {
        title: "아파 보이거나 부르짖었다면?",
        body: "돌봄에 대한 죄책감·불안이 클 수 있습니다. 현실의 아이에게 건강검진·루틴을 점검해 보면 마음이 한결 편해집니다.",
      },
    ],
    careTip:
      "사진 한 장을 꺼내 짧게 추억을 말해 보세요. 지금 함께하는 아이가 있다면, 오늘 쓰다듬 시간을 의도적으로 늘려 주세요.",
  },
  {
    situationId: "hug",
    slugPart: "hugging",
    titleVerb: "안아주는",
    omen: "길몽",
    summary:
      "애착·안정·상호 신뢰의 길몽으로 해석되는 경우가 많습니다. 관계가 든든하다는 확인이거나, 더 안고 싶다는 바람일 수 있어요.",
    psychology:
      "안는 행위는 보호·수용의 상징입니다. 바쁜 일상 속에서도 ‘가까이 있고 싶다’는 욕구가 꿈으로 나타날 수 있습니다.",
    situations: [
      {
        title: "아이가 먼저 안겼다면?",
        body: "신뢰와 의존이 깊다는 신호. 분리불안이 있다면 짧은 분리 훈련과 함께 ‘돌아온다’는 안심을 주세요.",
      },
      {
        title: "내가 꼭 끌어안았다면?",
        body: "보호 본능이 강한 상태. 집착으로 이어지지 않게, 아이의 개인 공간도 존중해 주세요.",
      },
    ],
    careTip:
      "좋아하면 배·가슴 쓰다듬, 싫어하면 턱·등만. ‘안아주기’도 아이 기준으로 맞춰 주세요.",
  },
  {
    situationId: "runaway",
    slugPart: "running-away",
    titleVerb: "도망가는",
    omen: "길흉혼재",
    summary:
      "놓침에 대한 불안, 혹은 아이가 자유를 원한다는 메시지일 수 있습니다. 현실에서 리드·문단속·산책 환경을 점검해 보세요.",
    psychology:
      "쫓아가도 잡히지 않는 장면은 ‘통제가 잘 안 된다’는 스트레스와 맞닿아 있습니다. 양육 부담이 클 때도 자주 나옵니다.",
    situations: [
      {
        title: "결국 다시 돌아왔다면?",
        body: "일시적 불안이 해소되는 흐름. 관계는 회복 가능하니 과도한 걱정은 내려놓아도 됩니다.",
      },
      {
        title: "영영 보이지 않았다면?",
        body: "상실 불안이 큽니다. 실제 탈출 위험을 점검하고, 마이크로칩·인식표도 확인해 보세요.",
      },
    ],
    careTip:
      "현관·베란다 이중 잠금, 산책 시 리드 상태를 오늘 한 번만 점검해 주세요.",
  },
  {
    situationId: "hurt",
    slugPart: "injured",
    titleVerb: "다치는",
    omen: "심리몽",
    summary:
      "대부분 건강 염려가 꿈으로 나타난 심리몽입니다. 실제 질환을 예고한다기보다, ‘챙기고 싶다’는 마음이 큽니다.",
    psychology:
      "다친 아이 꿈은 보호자의 취약성·책임감을 반영합니다. 최근 병원·이상 증상 경험이 있다면 더 선명해질 수 있어요.",
    situations: [
      {
        title: "내가 치료해 주었다면?",
        body: "돌봄 효능감이 회복되는 꿈. 스스로에게도 ‘잘하고 있다’고 말해 주세요.",
      },
      {
        title: "돕지 못하고 지켜만 봤다면?",
        body: "무력감이 있을 수 있습니다. 정기 검진 일정만이라도 잡아 두면 마음이 안정됩니다.",
      },
    ],
    careTip:
      "식욕·배변·활력만 오늘 체크해도 충분합니다. 이상하면 기록을 남기고 병원에 문의하세요.",
  },
  {
    situationId: "talk",
    slugPart: "talking",
    titleVerb: "말을 하는",
    omen: "길몽",
    summary:
      "소통 욕구·직관이 열리는 길몽으로 보는 경우가 많습니다. 아이가 ‘하고 싶은 말’이 있다는 상징이기도 합니다.",
    psychology:
      "말이 통하는 꿈은 공감·이해를 갈망하는 마음입니다. 행동 신호를 더 잘 읽고 싶다는 무의식일 수 있어요.",
    situations: [
      {
        title: "다정한 말을 했다면?",
        body: "관계가 따뜻한 시기. 칭찬·간식 타이밍을 늘려 보세요.",
      },
      {
        title: "화를 내거나 원망했다면?",
        body: "돌봄 루틴을 되돌아볼 신호. 혼내기보다 원인(심심함·통증·공포)을 먼저 살펴 주세요.",
      },
    ],
    careTip:
      "오늘 아이의 ‘요청 신호’(바라보기, 발 올리기)에 한 번은 바로 응답해 보세요.",
  },
  {
    situationId: "bite",
    slugPart: "biting",
    titleVerb: "무는",
    omen: "길흉혼재",
    summary:
      "경계·스트레스·놀이 과열의 상징일 수 있습니다. 현실 입질이 있다면 훈련·환경 자극을 점검하세요.",
    psychology:
      "물리는 꿈은 관계에서의 긴장, 혹은 ‘상처받을까 봐’ 하는 방어를 나타낼 수 있습니다.",
    situations: [
      {
        title: "세게 물렸다면?",
        body: "갈등·스트레스가 클 수 있어요. 무리한 스킨십을 잠시 줄여 보세요.",
      },
      {
        title: "살살 장난으로 물었다면?",
        body: "관심 요구일 때가 많습니다. 적절한 장난감으로 에너지를 풀어 주세요.",
      },
    ],
    careTip:
      "손 대신 장난감을, 혼내기보다 ‘멈추면 보상’ 루틴을 짧게 연습해 보세요.",
  },
  {
    situationId: "cry",
    slugPart: "crying",
    titleVerb: "우는",
    omen: "심리몽",
    summary:
      "분리불안·외로움·보호자의 죄책감이 반영된 심리몽인 경우가 많습니다.",
    psychology:
      "우는 소리 꿈은 ‘돌봄이 더 필요하다’는 알람입니다. 최근 외출이 길었다면 더 잘 나타납니다.",
    situations: [
      {
        title: "내가 달랬다면?",
        body: "애착이 단단하다는 신호. 짧은 분리 연습으로 자립도 키워 주세요.",
      },
      {
        title: "울음만 들리고 찾지 못했다면?",
        body: "상실·불안이 큽니다. 현실에서 아이와 눈을 맞추는 시간을 늘리세요.",
      },
    ],
    careTip:
      "외출 전후 ‘다녀올게/다녀왔어’ 의식을 만들어 주면 불안이 줄어듭니다.",
  },
  {
    situationId: "play",
    slugPart: "playing",
    titleVerb: "신나게 노는",
    omen: "길몽",
    summary:
      "활력·행복·좋은 에너지의 길몽입니다. 관계가 건강하거나, 더 놀고 싶다는 바람일 수 있어요.",
    psychology:
      "놀이 장면은 즐거움의 재현입니다. 스트레스가 풀리고 있다는 뜻이기도 합니다.",
    situations: [
      {
        title: "함께 놀았다면?",
        body: "유대가 깊다는 확인. 그 느낌을 현실에서도 이어가 보세요.",
      },
      {
        title: "혼자 신나게 놀았다면?",
        body: "독립과 만족의 신호. 안전한 장난감 환경을 유지해 주세요.",
      },
    ],
    careTip: "오늘은 새 장난감 없이도, 숨기기·찾기 놀이 5분이면 충분합니다.",
  },
  {
    situationId: "lost",
    slugPart: "lost",
    titleVerb: "잃어버린",
    omen: "심리몽",
    summary:
      "상실 불안·애착 걱정이 반영된 꿈입니다. 실제 미아 방지 점검을 겸하면 마음이 편해집니다.",
    psychology:
      "찾지 못하는 장면은 ‘소중한 것을 놓칠까’ 하는 보편적 불안입니다.",
    situations: [
      {
        title: "결국 찾았다면?",
        body: "불안이 해소되는 흐름. 안도의 감정을 기억해 두세요.",
      },
      {
        title: "끝까지 못 찾았다면?",
        body: "과도한 걱정일 수 있습니다. 인식표·칩·사진 백업을 확인해 보세요.",
      },
    ],
    careTip: "인식표 번호가 최신인지, 칩 등록 정보가 맞는지만 체크해 보세요.",
  },
  {
    situationId: "birth",
    slugPart: "giving-birth",
    titleVerb: "새끼를 낳는",
    omen: "길몽",
    summary:
      "풍요·시작·번창의 길몽으로 해석되는 경우가 많습니다. 새로운 계획의 상징이기도 합니다.",
    psychology:
      "출산 꿈은 ‘무언가가 태어난다’는 창조 욕구와 연결됩니다. 가족 확대 고민과도 닿을 수 있어요.",
    situations: [
      {
        title: "건강하게 낳았다면?",
        body: "좋은 결실·완성의 길조로 보는 전통 해석이 있습니다.",
      },
      {
        title: "어렵게 낳았다면?",
        body: "과정이 힘들지만 결실은 있다는 메시지. 무리하지 말고 페이스를 조절하세요.",
      },
    ],
    careTip:
      "중성화 여부·번식 계획은 수의사와 상의하세요. 꿈과 현실 계획은 분리해 판단하는 게 좋습니다.",
  },
  {
    situationId: "eat",
    slugPart: "eating",
    titleVerb: "맛있게 먹는",
    omen: "길몽",
    summary:
      "풍요·만족·건강 회복의 길몽으로 자주 읽힙니다. 급여·간식 고민이 있을 때도 나옵니다.",
    psychology:
      "먹는 장면은 돌봄의 핵심인 ‘먹여 살림’과 연결됩니다. 죄책감(간식 과다)이 있다면 조절 신호일 수 있어요.",
    situations: [
      {
        title: "내가 직접 먹였다면?",
        body: "돌봄 만족감이 큽니다. 그 온기를 유지하되 양은 지켜 주세요.",
      },
      {
        title: "사람이 먹는 걸 훔쳐 먹었다면?",
        body: "관심·호기심. 금지 음식 목록을 한 번 더 확인해 보세요.",
      },
    ],
    careTip:
      "사람 음식은 위험할 수 있어요. ‘먹어도 되나요’ 툴로 한 번 더 확인해 보세요.",
  },
  {
    situationId: "bath",
    slugPart: "bathing",
    titleVerb: "목욕하는",
    omen: "길몽",
    summary:
      "정화·새 출발·스트레스 해소의 상징으로 해석되는 경우가 많습니다.",
    psychology:
      "물·씻기는 감정 정화를 뜻합니다. 관계를 ‘깨끗이’ 하고 싶다는 마음일 수 있어요.",
    situations: [
      {
        title: "즐거워했다면?",
        body: "적응과 신뢰의 신호. 그루밍 루틴이 잘 맞고 있을 수 있습니다.",
      },
      {
        title: "극도로 싫어했다면?",
        body: "스트레스 자극이 큰 상태. 목욕 간격을 조절하거나 드라이 케어를 검토하세요.",
      },
    ],
    careTip: "억지 목욕보다, 발·엉덩이만 닦는 짧은 위생 케어부터 시도해 보세요.",
  },
  {
    situationId: "chase",
    slugPart: "chasing",
    titleVerb: "쫓아오는",
    omen: "길흉혼재",
    summary:
      "애착이 강하거나, 경계·부담이 동시에 있을 수 있는 꿈입니다.",
    psychology:
      "쫓기는 느낌은 압박감, 쫓아오는 아이는 ‘관심 욕구’일 때가 많습니다.",
    situations: [
      {
        title: "귀엽게 졸졸 따라왔다면?",
        body: "껌딱지 애착. 짧은 독립 시간도 연습해 주세요.",
      },
      {
        title: "무섭게 쫓아왔다면?",
        body: "관계의 긴장·죄책감일 수 있습니다. 억지 훈육을 잠시 멈춰 보세요.",
      },
    ],
    careTip: "따라다니면 짧게 쓰다듬고, ‘기다려’ 뒤에 보상을 주어 리듬을 만드세요.",
  },
  {
    situationId: "kiss",
    slugPart: "kissing",
    titleVerb: "핥아주거나 뽀뽀하는",
    omen: "길몽",
    summary:
      "애정·신뢰·화해의 길몽입니다. 스킨십이 편안한 관계라는 확인이기도 합니다.",
    psychology:
      "핥기·뽀뽀는 사회적 애정 표현입니다. 보호자도 더 다정해지고 싶다는 바람일 수 있어요.",
    situations: [
      {
        title: "얼굴·손을 핥았다면?",
        body: "강한 애착과 환영. 위생만 챙기며 받아들여 주세요.",
      },
      {
        title: "내가 먼저 뽀뽀했다면?",
        body: "표현 욕구가 큼. 아이가 싫어하면 거리를 존중하세요.",
      },
    ],
    careTip: "오늘 ‘좋아하는 부위만’ 짧게 쓰다듬는 애정 타임을 가져 보세요.",
  },
];

/** 종별 SEO 상세에 올릴 동물 (기타 제외 — 툴에서만) */
const SEO_ANIMALS: DreamAnimal[] = [
  "dog",
  "cat",
  "rabbit",
  "hamster",
  "turtle",
  "bird",
  "fish",
  "hedgehog",
];

function buildArticle(animal: DreamAnimal, seed: Seed): DreamArticle {
  const ko = ANIMAL_KO[animal];
  const slug = `${seed.slugPart}-${animal}`;
  const title = `${ko}가 ${seed.titleVerb} 꿈, 무슨 의미일까요?`;
  const description = `${ko}가 ${seed.titleVerb} 꿈 해몽 — ${seed.omen}. ${seed.summary.slice(0, 80)}… 유아독존 반려동물 꿈 해몽소.`;

  const related = SEEDS.filter((s) => s.situationId !== seed.situationId)
    .slice(0, 3)
    .map((s) => `${s.slugPart}-${animal}`);

  // cross-animal related for variety
  const otherAnimal =
    SEO_ANIMALS[(SEO_ANIMALS.indexOf(animal) + 1) % SEO_ANIMALS.length];
  related.push(`${seed.slugPart}-${otherAnimal}`);

  return {
    slug,
    animal,
    situationId: seed.situationId,
    title,
    description,
    keywords: [
      `${ko} 꿈`,
      `${ko} ${seed.titleVerb} 꿈`,
      `${ko} 꿈 해몽`,
      "반려동물 꿈",
      "꿈 해몽",
      "유아독존",
    ],
    omen: seed.omen,
    summary: seed.summary.replace(/아이/g, ko === "강아지" || ko === "고양이" ? "아이" : ko),
    psychology: seed.psychology,
    situations: seed.situations,
    careTip: seed.careTip,
    relatedSlugs: related,
  };
}

export const DREAM_ARTICLES: DreamArticle[] = SEO_ANIMALS.flatMap((animal) =>
  SEEDS.map((seed) => buildArticle(animal, seed))
);

export function getDreamBySlug(slug: string): DreamArticle | undefined {
  return DREAM_ARTICLES.find((a) => a.slug === slug);
}

export function getDreamSlugs(): string[] {
  return DREAM_ARTICLES.map((a) => a.slug);
}

export function listDreamsByAnimal(animal?: DreamAnimal): DreamArticle[] {
  if (!animal) return DREAM_ARTICLES;
  return DREAM_ARTICLES.filter((a) => a.animal === animal);
}

export function findDreamArticle(
  animal: DreamAnimal,
  situationId: DreamSituationId
): DreamArticle | undefined {
  const a = animal === "other" ? "dog" : animal;
  return DREAM_ARTICLES.find(
    (d) => d.animal === a && d.situationId === situationId
  );
}

export function animalLabel(id: DreamAnimal) {
  return DREAM_ANIMAL_OPTIONS.find((o) => o.id === id)?.short ?? "반려동물";
}

export function situationLabel(id: DreamSituationId) {
  return DREAM_SITUATION_OPTIONS.find((o) => o.id === id)?.label ?? "꿈";
}
