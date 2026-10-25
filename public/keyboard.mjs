// Four staggered rows inspired by the user's photographed mechanical keyboard.
// The photographed number row starts at 2; retain that arrangement.
const print = (key, shifted = '') => ({ key, shifted });
const action = (name, label) => ({ action: name, label });
export const keyboardRows = [
  [action('backspace', '⌫'), ...[['2','"'],['3','#'],['4','$'],['5','%'],['6','-'],['7','&'],['8',"'"],['9','('],['0',')'],['-','*']].map(pair => print(...pair)), action('tab', 'TAB')],
  [...'QWERTYUIOP'].map(letter => print(letter)).concat(print('¼','½'), action('return','↵')),
  [...'ASDFGHJKL'].map(letter => print(letter)).concat(print(';',':'),print('¢','@')),
  [action('shift','⇧'), ...[...'ZXCVBNM'].map(letter => print(letter)), print(',','!'), print('.','.'), print('/','?'), action('shift','⇧')],
];
