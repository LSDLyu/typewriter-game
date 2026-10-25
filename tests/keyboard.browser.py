"""Browser acceptance for the reference keyboard (Python Playwright + Chromium).
Start: python3 -m http.server 4173 --directory public
Run: python tests/keyboard.browser.py
TYPEWRITER_TEST_URL may select another game base URL; directory navigation is
intercepted to verify native activation without depending on the full edu app.
Touch and iPad viewport checks are simulations, not physical device tests.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
import json,os
ROOT=Path(os.environ.get('TYPEWRITER_TEST_OUT','artifacts/reference-keyboard'));(ROOT/'screenshots').mkdir(parents=True,exist_ok=True);BASE=os.environ.get('TYPEWRITER_TEST_URL','http://127.0.0.1:4173').rstrip('/');rows=[]
levels=[['CAT','SUN'],['HELLO','GOOD DAY'],['I CAN TYPE.','YOU CAN TOO.'],['RED ROSE','BLUE SKY'],['MAKE A WISH.','KEEP LEARNING.','THE END.']]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for w,h in [(320,568),(390,844),(768,1024),(1024,768),(1440,1000),(852,393)]:
  for en in [False,True]:
   c=b.new_context(viewport={'width':w,'height':h},has_touch=w<1200);c.add_init_script("if(!localStorage.getItem('zide-typewriter-v1'))localStorage.setItem('zide-typewriter-v1',JSON.stringify({unlocked:4,settings:{sound:false}}))");c.route('**/games/',lambda route:route.fulfill(status=200,content_type='text/html',body='<main>Game directory</main>'));page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));url=BASE+('/?lang=en'if en else '/');page.goto(url,wait_until='networkidle');assert page.locator('.key').count()==48
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(w,en)
   for i,word in [(1,'QWERTYUIOP'),(2,'ASDFGHJKL'),(3,'ZXCVBNM')]:
    actual=page.locator(f'.keyboard-row-{i} .key[data-key]').evaluate_all("(es)=>es.filter(e=>/^[A-Z]$/.test(e.dataset.key)).sort((a,b)=>a.getBoundingClientRect().left-b.getBoundingClientRect().left).map(e=>e.dataset.key).join('')");assert actual==word,(w,actual)
   assert page.locator('.key[data-key="."]').get_attribute('aria-label')==('Type period'if en else '输入句点')
   page.locator('.keyboard-shell').screenshot(path=str(ROOT/'screenshots'/f'keyboard-{w}-{h}-{en}.png'))
   # Every key remains in the original row arrangement when enlarged.
   page.locator('#keyboard-zoom').click();expect(page.locator('#keyboard-zoom')).to_have_attribute('aria-pressed','true');sizes=page.locator('.key').evaluate_all('(es)=>es.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))');assert min(x['w']for x in sizes)>=44 and min(x['h']for x in sizes)>=44,(w,sizes);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   if w==320 and not en:
    for key in page.locator('.key').all():
     key.focus();page.wait_for_timeout(60);assert key.evaluate('(e)=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}'),key.get_attribute('aria-label')
   if w==390 and not en:
    v=page.locator('#keyboard-viewport');v.scroll_into_view_if_needed();box=v.bounding_box();client=c.new_cdp_session(page)
    for i in range(9):client.send('Input.dispatchTouchEvent',{'type':'touchStart'if i==0 else 'touchMove','touchPoints':[{'x':box['x']+box['width']-35-i*25,'y':box['y']+140,'id':1}]})
    client.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});client.detach();page.wait_for_timeout(300);assert v.evaluate('(e)=>e.scrollLeft')>80;assert page.locator('.imprint').count()==0
    page.locator('.keyboard-shell').screenshot(path=str(ROOT/'screenshots/phone-enlarged-scroll.png'))
   # Printable digits/symbols are real, correctable imprints; Shift is one-shot.
   page.locator('.key[data-key="2"]').click();expect(page.locator('.imprint').last).to_have_text('2');page.locator('.key[data-action=backspace]').click();assert page.locator('.imprint').count()==0
   page.locator('.key[data-action=shift]').first.click();page.locator('.key[data-key="3"]').click();expect(page.locator('.imprint').last).to_have_text('#');expect(page.locator('.key[data-action=shift]').first).to_have_attribute('aria-pressed','false');page.locator('.key[data-action=backspace]').click()
   page.locator('.key[data-action=shift]').last.click();page.locator('.key[data-key="¼"]').click();expect(page.locator('.imprint').last).to_have_text('½');page.locator('.key[data-action=backspace]').click()
   page.locator('.key[data-action=tab]').click();assert page.locator('.imprint').last.inner_text()=='\xa0';page.locator('.key[data-action=backspace]').click()
   # New carriage return button and the existing word-picture/audio mapping agree.
   for char in 'CAT':page.locator(f'.key[data-key="{char}"]').click()
   page.locator('.key[data-action=return]').click();expect(page.locator('#target-text')).to_have_text('SUN');assert page.locator('#target-picture').get_attribute('data-target')=='SUN'
   page.reload();expect(page.locator('#keyboard-zoom')).to_have_attribute('aria-pressed','true');page.locator('#keyboard-zoom').click();assert page.locator('#keyboard-viewport').evaluate('(e)=>e.scrollLeft')==0
   if (w==320 and not en)or(w==390 and en)or(w==768 and en):
    for i,words in enumerate(levels):
     page.locator('#mission-panel').evaluate('(e)=>e.open=true');page.locator('#level-list button').nth(i).click();page.locator('#mission-panel').evaluate('(e)=>e.open=false')
     for word in words:
      expect(page.locator('#target-text')).to_have_text(word);assert page.locator('#target-picture').get_attribute('data-target')==word
      if word=='RED ROSE':page.locator('[data-ink=red]').click()
      if word=='BLUE SKY':page.locator('[data-ink=black]').click()
      page.locator('#target-text').click();page.keyboard.type(word);page.locator('#return-button').click()
     (page.locator('#next-button')if i==4 else page.locator('#replay-button')).click()
   # Tab/Enter/Space retain their browser meaning in the shared shadow navigation.
   page.locator('#zgs-header .audio-toggle').focus();page.keyboard.press('Space');expect(page.locator('#zgs-header .audio-toggle')).to_have_attribute('aria-pressed','true');page.locator('#zgs-header a[href="'+('/en'if en else '')+'/games/"]').focus();page.keyboard.press('Enter');page.wait_for_url('**/'+('en/'if en else '')+'games/')
   assert not errors,errors
   rows.append({'width':w,'height':h,'locale':'en'if en else 'zh','keys':48,'minEnlargedWidth':min(x['w']for x in sizes),'minEnlargedHeight':min(x['h']for x in sizes),'passed':True});(ROOT/'browser.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('PASS',w,h,'en'if en else 'zh',flush=True);c.close()
 b.close()
