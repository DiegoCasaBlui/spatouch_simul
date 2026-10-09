import { useState } from 'react';
import './connections.css';
import { QRCodeSVG } from 'qrcode.react';
import { Icon } from './icons';
import { SideNav } from './Screens';
import { RoundButton, useUI } from './ui';

const NETWORKS = ['Spa Home', 'Garden WiFi', 'Guest Network'];
const SERIAL = 'DEMO-42410-0001';
type Step = 'networks' | 'confirm' | 'code' | 'keyboard' | 'qr';
const cleanCode = (value: string) => value.replace(/[^a-z0-9-]/gi, '').slice(0, 24);

/** Local registration mock-up based on the user's Wi-Fi/CMS screenshots. */
export function ConnectionsScreen() {
  const { s, dispatch, go, t } = useUI();
  const [step, setStep] = useState<Step>('networks');
  const [code, setCode] = useState(s.cmsCode);
  const [draft, setDraft] = useState(s.cmsCode);
  const [uppercase, setUppercase] = useState(false);
  const [numbers, setNumbers] = useState(false);
  const connected = s.connection !== 'Offline' && !!s.wifiNetwork;
  const canFinish = /[a-z0-9]/i.test(draft);
  const change = (action: () => void) => {
    if (s.settings.settingsLocked || s.settings.panelLocked) { go('connections'); return; }
    action();
  };
  const back = () => {
    if (!connected || step === 'networks') go('settings');
    else setStep(step === 'keyboard' || step === 'qr' ? 'code' : 'networks');
  };
  const openKeyboard = () => { setDraft(code); setStep('keyboard'); };
  const finish = () => change(() => {
    if (!canFinish || !connected) return;
    const value = draft.toUpperCase();
    setCode(value);
    dispatch({ type: 'state', patch: { cmsCode: value, connection: 'Cloud' } });
    setStep('qr');
  });
  const selectNetwork = (network: string) => change(() => {
    setStep('networks');
    if (s.wifiNetwork !== network || !connected) {
      dispatch({ type: 'state', patch: { wifiNetwork: network, connection: 'Local', cmsCode: '' } });
      setCode(''); setDraft('');
    }
  });
  const rows = numbers ? ['1234567890', '-'] : ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  const visibleStep = connected ? step : 'networks';
  return <>
    <div className="settings-header cms-header"><h2>{visibleStep === 'networks' || visibleStep === 'confirm' ? t('Connections') : 'CMS'}</h2><button aria-label={t('Back')} onClick={back}><Icon name="back" size={32}/></button></div>
    <SideNav screen="connections"/>
    <section className={`connections-content cms-${visibleStep}`} aria-label="Wi-Fi setup">
      {visibleStep === 'networks' && <>
        <div className="wifi-networks" role="group" aria-label="Wi-Fi networks">
          {NETWORKS.map(network => <button key={network} className={`wifi-network ${connected && s.wifiNetwork === network ? 'selected' : ''}`} aria-pressed={connected && s.wifiNetwork === network} onClick={() => selectNetwork(network)}><Icon name="wifi" size={34}/><span>{network}</span>{connected && s.wifiNetwork === network && <Icon name="check" size={25}/>}</button>)}
        </div>
        <button className="cms-connect" disabled={!connected} onClick={() => change(() => setStep('confirm'))}>Control My Spa</button>
      </>}
      {visibleStep === 'confirm' && <div className="cms-confirmation"><p>Would you like to register the spa?</p><div className="cms-actions"><RoundButton icon="close" label="Cancel registration" onClick={() => setStep('networks')}/><RoundButton icon="check" label="Confirm registration" onClick={() => change(() => setStep('code'))}/></div></div>}
      {visibleStep === 'code' && <div className="cms-code-form">
        <p>SN: {SERIAL}</p><label id="cms-code-label">CMS:</label>
        <button className="cms-code-field" aria-labelledby="cms-code-label" onClick={() => change(openKeyboard)}>{code || <span className="cms-placeholder">Enter CMS code</span>}</button>
        <p className="cms-instructions">Please input the CMS code<br/>provided by your dealer.</p>
        {code && <RoundButton icon="check" label="Show QR code" onClick={() => change(() => { dispatch({ type: 'state', patch: { cmsCode: code, connection: 'Cloud' } }); setStep('qr'); })}/>}
      </div>}
      {visibleStep === 'keyboard' && <div className="cms-keyboard-screen">
        <input autoFocus className="cms-keyboard-input" aria-label="CMS code" value={draft} maxLength={24} inputMode="none" autoComplete="off" autoCapitalize="characters" spellCheck={false} onChange={e => setDraft(cleanCode(e.target.value))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); finish(); } if (e.key === 'Escape') { e.preventDefault(); setStep('code'); } }}/>
        <div className="cms-keyboard" role="group" aria-label="On-screen keyboard" onPointerDown={e => e.preventDefault()}>
          {rows.map((row, i) => <div className="cms-key-row" key={i}>{!numbers && i === 2 && <button className="cms-key-wide" aria-label="Shift" aria-pressed={uppercase} onClick={() => setUppercase(!uppercase)}>⇧</button>}{[...row].map(letter => {const key = uppercase ? letter.toUpperCase() : letter;return <button key={letter} aria-label={`Key ${key}`} onClick={() => setDraft(value => cleanCode(value + key))}>{key}</button>;})}{!numbers && i === 2 && <button className="cms-key-wide" aria-label="Backspace" onClick={() => setDraft(value => value.slice(0, -1))}>⌫</button>}</div>)}
          <div className="cms-key-row cms-key-bottom"><button className="cms-key-wide" aria-label={numbers ? 'Letters' : 'Numbers and symbols'} onClick={() => setNumbers(!numbers)}>{numbers ? 'ABC' : '?123'}</button>{numbers && <button className="cms-key-wide" aria-label="Backspace" onClick={() => setDraft(value => value.slice(0, -1))}>⌫</button>}<button className="cms-key-wide" aria-label="Cancel code entry" onClick={() => setStep('code')}><Icon name="close"/></button><button className="cms-key-done" aria-label="Finish CMS code" disabled={!canFinish} onClick={finish}><Icon name="check" size={30}/></button></div>
        </div>
      </div>}
      {visibleStep === 'qr' && <div className="cms-result"><div className="cms-result-details"><p>SN: {SERIAL}</p><p>CMS Code: {code}</p></div><QRCodeSVG role="img" aria-label="CMS registration QR code" value={JSON.stringify({ simulator: 'SpaTouch 4 demo', sn: SERIAL, cms: code })} size={200} marginSize={4} level="M"/><p className="cms-scan-instructions">Scan this QR Code with<br/>the "Control My Spa" app</p></div>}
    </section>
  </>;
}
