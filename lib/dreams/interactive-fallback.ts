import type { DreamAnimal } from "@/lib/dreams/types";
import { animalLabel } from "@/lib/dreams/catalog";
import type { DreamLongform } from "@/lib/dreams/longform-types";

export function fallbackInteractiveLongform(opts: {
  animal: DreamAnimal;
  situationLabel: string;
  petName?: string;
  mood?: string | null;
  errorHint?: string;
}): DreamLongform {
  const name = opts.petName?.trim() || animalLabel(opts.animal);
  const animal = animalLabel(opts.animal);
  const sit = opts.situationLabel;

  const symbolism = [
    `오늘 꿈속에서 ${name}가(이) ‘${sit}’ 장면을 보여 준 것은, ${animal}와의 관계가 보호자의 무의식에 깊이 자리해 있다는 증거입니다.`,
    "",
    "꿈은 길흉을 찍어 주는 도장이라기보다, 최근의 돌봄 리듬·감정·그리움을 비추는 거울에 가깝습니다. 장면이 밝았다면 자유·애착·회복의 에너지가, 불안했다면 건강·분리·죄책감에 대한 염려가 섞였을 수 있어요.",
    "",
    "전통 해몽에서는 비슷한 꿈을 길몽·흉몽으로 나누기도 하지만, 반려동물 꿈에서는 ‘아이를 더 잘 챙기고 싶다’는 마음이 공통분모인 경우가 많습니다. 단정하지 말고, 깨어난 뒤의 첫 감정(설렘·불안·슬픔·평온)을 단서로 삼아 보세요.",
    "",
    "특히 검색이나 대화로 같은 꿈을 확인하려는 보호자라면, 이미 아이와의 유대를 진지하게 여기고 계신 겁니다. 그 진지함 자체가 가장 좋은 해몽의 출발점입니다.",
  ].join("\n");

  const psychology = [
    opts.mood
      ? `지금 느끼신 ‘${opts.mood}’ 감정은 꿈의 해석을 좌우하는 중요한 열쇠입니다. 같은 장면이라도 감정에 따라 위로가 되기도, 경고처럼 느껴지기도 합니다.`
      : "보호자의 현재 감정 상태를 함께 살피면 해몽이 더 정확해집니다. 불안·그리움·평온 중 어디에 가까운지 짚어 보세요.",
    "",
    "바쁜 일상 속에서 아이와의 시간이 줄면, 무의식은 꿈으로 ‘다시 만나자’고 초대합니다. 반대로 과도한 집착·완벽주의가 있다면, 꿈은 숨 쉴 공간을 요청할 수도 있습니다.",
    "",
    "자신을 탓하기보다, ‘오늘 무엇을 하나 더 해줄 수 있을까’로 시선을 옮기면 마음이 한결 가벼워집니다.",
  ].join("\n");

  return {
    omen: /죽|다치|피|잃어|무/.test(sit) ? "심리몽" : "길흉혼재",
    headline: `꿈속 ${name}의 이야기, 마음을 천천히 읽어 볼게요`,
    summaryBox: `${animal}의 ‘${sit}’ 꿈은 관계·돌봄·감정 리듬을 돌아보라는 신호로 읽는 것이 좋습니다. 예언이 아니라 초대입니다.`,
    symbolism,
    details: [
      {
        title: "꿈의 분위기가 따뜻했다면?",
        body: "애착과 신뢰가 바탕에 있습니다. 그 온기를 현실의 짧은 놀이나 쓰다듬으로 이어가 보세요.",
      },
      {
        title: "불안하거나 급했다면?",
        body: "건강·안전·분리에 대한 염려일 수 있습니다. 식욕·활력·배변만 체크해도 마음이 안정됩니다.",
      },
      {
        title: "말이 안 통한다고 느껴졌다면?",
        body: "행동 신호를 더 읽고 싶다는 바람입니다. 오늘 아이의 ‘요청 신호’에 한 번은 바로 응답해 보세요.",
      },
    ],
    psychology,
    careTip:
      "오늘 저녁, 평소보다 5~10분만 더 함께해 주세요. 산책·사냥놀이·조용한 스킨십 중 아이가 좋아하는 방식으로요. 꿈 해몽의 진짜 완성은 현실의 작은 돌봄입니다.",
    quote: "꿈은 아이를 떠올리게 하는 마음이지, 아이를 단죄하는 판결문이 아닙니다.",
    generatedAt: new Date().toISOString(),
    source: "fallback",
  };
}
