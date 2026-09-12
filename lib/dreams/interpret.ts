import {
  animalLabel,
  findDreamArticle,
  situationLabel,
} from "@/lib/dreams/catalog";
import type {
  DreamInterpretInput,
  DreamInterpretResult,
  DreamMood,
  DreamOmen,
  DreamSituationId,
} from "@/lib/dreams/types";

const MOOD_COMMENT: Record<DreamMood, string> = {
  설렘: "설레는 마음이 꿈에도 묻어났나 봐요. 그 설렘을 오늘 짧은 놀이로 나눠 주세요.",
  불안: "불안한 날의 꿈은 더 선명해지기 쉽습니다. 아이와 눈을 맞추는 것만으로도 마음이 풀릴 수 있어요.",
  슬픔: "슬픈 마음은 꿈으로 위로를 청하곤 합니다. 오늘만큼은 스스로를 다그치지 않아도 됩니다.",
  평온: "평온한 상태의 꿈은 관계를 확인하는 따뜻한 신호일 때가 많아요.",
  그리움: "그리움이 깊을수록 꿈이 또렷해집니다. 추억을 한 번 꺼내 말해 보는 것도 치유가 됩니다.",
};

function omenFromCustom(text: string): DreamOmen {
  if (/죽|다치|피|잃어|도망|무/.test(text)) return "심리몽";
  if (/날|안|놀|먹|뽀뽀|핥|말/.test(text)) return "길몽";
  return "길흉혼재";
}

function customMeaning(animal: string, text: string): string {
  const t = text.trim() || "특별한 행동";
  return `${animal}가 꿈속에서 ‘${t}’ 한 장면은, 보호자의 무의식이 아이와의 관계를 다시 정리하려는 신호일 수 있어요. 길흉을 단정하기보다, 최근 돌봄·감정·일상의 리듬을 돌아보는 기회로 받아들여 보세요.`;
}

export function interpretDream(
  input: DreamInterpretInput
): DreamInterpretResult {
  const name = input.petName.trim() || animalLabel(input.animal);
  const animalKo = animalLabel(input.animal);
  const moodLine = input.mood ? MOOD_COMMENT[input.mood] : null;

  if (input.situationId !== "custom") {
    const article = findDreamArticle(input.animal, input.situationId);
    const sitLabel = situationLabel(input.situationId as DreamSituationId);
    const title = `오늘 꿈속에서 ${name}${
      /[가-힣]$/.test(name) ? "가" : "이"
    } ${sitLabel.replace(" 꿈", "")} 이유는요…`;

    if (article) {
      return {
        title,
        omen: article.omen,
        meaning: `${article.summary}\n\n${article.psychology}`,
        comment:
          moodLine ||
          article.careTip ||
          "오늘 저녁은 아이와 짧은 스킨십 시간을 가져 보세요.",
        matchedSlug: article.slug,
      };
    }

    return {
      title,
      omen: "심리몽",
      meaning: customMeaning(animalKo, sitLabel),
      comment: moodLine || "오늘 하루, 아이 곁에 마음을 조금 더 두어 보세요.",
      matchedSlug: null,
    };
  }

  const custom = input.customText.trim();
  return {
    title: `꿈속 ${name}의 이야기, 이렇게 읽어 볼 수 있어요`,
    omen: omenFromCustom(custom),
    meaning: customMeaning(animalKo, custom),
    comment:
      moodLine ||
      "최근 아이에게 조금 소홀하진 않았나요? 오늘 저녁은 함께하는 시간을 조금만 늘려 보세요.",
    matchedSlug: null,
  };
}
