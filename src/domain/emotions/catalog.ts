export type Emotion = {id:string;name:string;group:string};
const names = ['기쁨','설렘','편안함','고마움','만족','자랑스러움','안도','기대','흥미','다정함','외로움','그리움','서운함','슬픔','허전함','답답함','지침','무기력','걱정','불안','두려움','긴장','당황','부끄러움','죄책감','질투','화남','짜증','억울함','답답함','실망','후회','혼란','놀람','부담','초조함','피곤함','공허함','속상함','무덤덤함','차분함','집중','해방감'];
export const EMOTIONS: Emotion[] = names.map((name,index)=>({id:`emotion-${String(index+1).padStart(2,'0')}`,name,group:index<10?'기쁨·설렘':index<20?'머무름·답답함':index<30?'걱정·불안':'지침·무거움'}));
