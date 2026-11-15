import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { shrinkImage } from '../lib/image'
import { HAZARDS, MODES } from '../data/hazards'
import type { Mode } from '../data/hazards'

type Danger = 'yes' | 'no' | 'unsure'
type Privacy = 'anonymous' | 'confidential' | 'identified'
type Place = { lat: number; lng: number; accuracy: number; at: Date }
type LocState = 'idle' | 'getting' | 'ok' | 'error'
type Stage = 'form' | 'sending' | 'done'
type FormError = '' | 'contact' | 'name' | 'photo' | 'send' | 'config'

const TOTAL_STEPS = 5

export default function Report() {
  const { t } = useTranslation()
  const [reportId] = useState(() => crypto.randomUUID())
  const [step, setStep] = useState(1)
  const [mode, setMode] = useState<Mode | null>(null)
  const [hazard, setHazard] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [description, setDescription] = useState('')
  const [danger, setDanger] = useState<Danger>('unsure')
  const [privacy, setPrivacy] = useState<Privacy>('anonymous')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [place, setPlace] = useState<Place | null>(null)
  const [locState, setLocState] = useState<LocState>('idle')
  const [stage, setStage] = useState<Stage>('form')
  const [formError, setFormError] = useState<FormError>('')
  const [reference, setReference] = useState('')

  function requestLocation() {
    if (!('geolocation' in navigator)) {
      setLocState('error')
      return
    }
    setLocState('getting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPlace({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          at: new Date(pos.timestamp),
        })
        setLocState('ok')
      },
      () => setLocState('error'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    )
  }

  function chooseMode(m: Mode) {
    setMode(m)
    setHazard('')
    setStep(2)
  }

  function chooseHazard(h: string) {
    setHazard(h)
    setStep(3)
    if (locState !== 'ok') requestLocation()
  }

  function onPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    if (preview) URL.revokeObjectURL(preview)
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
    setFormError('')
  }

  function removePhoto() {
    if (preview) URL.revokeObjectURL(preview)
    setPhoto(null)
    setPreview('')
  }

  function goFromPrivacy() {
    if (privacy !== 'anonymous') {
      if (privacy === 'identified' && !name.trim()) {
        setFormError('name')
        return
      }
      if (!phone.trim() && !email.trim()) {
        setFormError('contact')
        return
      }
    }
    setFormError('')
    setStep(5)
  }

  async function submit() {
    if (!supabaseConfigured) {
      setFormError('config')
      return
    }
    if (!mode || !place) return
    setStage('sending')
    setFormError('')

    let photoPath: string | null = null
    if (photo) {
      try {
        const blob = await shrinkImage(photo)
        const path = `${reportId}.jpg`
        const { error } = await supabase.storage
          .from('report-photos')
          .upload(path, blob, { contentType: 'image/jpeg' })
        // A retry may find the photo already uploaded. That is fine.
        if (error && !/exists/i.test(error.message)) throw error
        photoPath = path
      } catch {
        setFormError('photo')
        setStage('form')
        return
      }
    }

    try {
      const withContact = privacy !== 'anonymous'
      const { data, error } = await supabase.rpc('submit_report', {
        p_id: reportId,
        p_mode: mode,
        p_hazard_type: hazard,
        p_description: description,
        p_lat: place.lat,
        p_lng: place.lng,
        p_accuracy_m: place.accuracy,
        p_observed_at: place.at.toISOString(),
        p_people_in_danger: danger,
        p_privacy: privacy,
        p_is_emergency: false,
        p_photo_path: photoPath,
        p_name: withContact ? name : null,
        p_phone: withContact ? phone : null,
        p_email: withContact ? email : null,
      })
      if (error) throw error
      setReference(String(data))
      setStage('done')
    } catch {
      setFormError('send')
      setStage('form')
    }
  }

  const errorText: Record<Exclude<FormError, ''>, string> = {
    contact: t('report.errorContact'),
    name: t('report.errorName'),
    photo: t('report.errorPhoto'),
    send: t('report.errorSend'),
    config: t('report.errorConfig'),
  }

  if (stage === 'done') {
    return (
      <section className="container section">
        <div className="panel">
          <div className="success" role="status">
            <h1 className="h-small">{t('report.doneTitle')}</h1>
            <p>{t('report.doneText')}</p>
            <p className="ref-label">{t('report.reference')}</p>
            <p className="ref">{reference}</p>
            <p>{t('report.doneNotice')}</p>
            <div className="cta-row">
              <Link to="/" className="btn btn-ghost-dark">
                {t('report.backHome')}
              </Link>
              <a href="/report" className="btn btn-gold">
                {t('report.another')}
              </a>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="container section">
      <h1 className="h-small">{t('report.title')}</h1>
      <p className="step-label">{t('report.step', { current: step, total: TOTAL_STEPS })}</p>
      <div className="progress" aria-hidden="true">
        <span style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
      </div>

      {step === 1 && (
        <div>
          <h2>{t('report.modeTitle')}</h2>
          <div className="tiles">
            {MODES.map((m) => (
              <button key={m} className="tile" onClick={() => chooseMode(m)}>
                <strong>{t(`modes.${m}.name`)}</strong>
                <span>{t(`modes.${m}.text`)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && mode && (
        <div>
          <h2>{t('report.hazardTitle')}</h2>
          <div className="tiles">
            {HAZARDS[mode].map((h) => (
              <button key={h} className="tile" onClick={() => chooseHazard(h)}>
                <strong>{t(`hazards.${h}`)}</strong>
              </button>
            ))}
          </div>
          <button className="btn btn-ghost-dark back" onClick={() => setStep(1)}>
            {t('report.back')}
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2>{t('report.evidenceTitle')}</h2>
          <p className="lead-dark">{t('report.evidenceLead')}</p>

          <div className="panel">
            <label className="field">
              <span>{t('report.photoLabel')}</span>
              <input type="file" accept="image/*" capture="environment" onChange={onPhoto} />
            </label>
            {preview && (
              <div className="preview">
                <img src={preview} alt={t('report.photoAlt')} />
                <button className="btn btn-ghost-dark" onClick={removePhoto}>
                  {t('report.photoRemove')}
                </button>
              </div>
            )}

            <label className="field">
              <span>{t('report.descLabel')}</span>
              <textarea
                rows={3}
                maxLength={1000}
                value={description}
                placeholder={t('report.descPlaceholder')}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <div className="loc" role="status">
              <strong>{t('report.locationTitle')}</strong>
              {locState === 'getting' && <p>{t('report.locationGetting')}</p>}
              {locState === 'ok' && place && (
                <p>
                  {t('report.locationOk', {
                    lat: place.lat.toFixed(5),
                    lng: place.lng.toFixed(5),
                    acc: Math.round(place.accuracy),
                  })}
                </p>
              )}
              {locState === 'error' && (
                <>
                  <p>{t('report.locationError')}</p>
                  <button className="btn btn-ghost-dark" onClick={requestLocation}>
                    {t('report.locationRetry')}
                  </button>
                </>
              )}
              {locState === 'idle' && (
                <button className="btn btn-ghost-dark" onClick={requestLocation}>
                  {t('report.locationRetry')}
                </button>
              )}
            </div>
          </div>

          <div className="cta-row">
            <button className="btn btn-ghost-dark" onClick={() => setStep(2)}>
              {t('report.back')}
            </button>
            <button className="btn btn-gold" disabled={locState !== 'ok'} onClick={() => setStep(4)}>
              {t('report.next')}
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2>{t('report.dangerTitle')}</h2>
          <div className="tiles tiles-3">
            {(['yes', 'no', 'unsure'] as const).map((d) => (
              <button
                key={d}
                className="tile"
                aria-pressed={danger === d}
                onClick={() => setDanger(d)}
              >
                <strong>{t(`report.danger.${d}`)}</strong>
              </button>
            ))}
          </div>

          <h2 className="gap-top">{t('report.privacyTitle')}</h2>
          <div className="tiles">
            {(['anonymous', 'confidential', 'identified'] as const).map((p) => (
              <button
                key={p}
                className="tile"
                aria-pressed={privacy === p}
                onClick={() => {
                  setPrivacy(p)
                  setFormError('')
                }}
              >
                <strong>{t(`report.privacy.${p}.name`)}</strong>
                <span>{t(`report.privacy.${p}.text`)}</span>
              </button>
            ))}
          </div>

          {privacy !== 'anonymous' && (
            <div className="panel gap-top">
              <label className="field">
                <span>{t('report.nameLabel')}</span>
                <input type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="field">
                <span>{t('report.phoneLabel')}</span>
                <input type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label className="field">
                <span>{t('report.emailLabel')}</span>
                <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
            </div>
          )}

          {formError !== '' && (formError === 'contact' || formError === 'name') && (
            <p className="error" role="alert">
              {errorText[formError]}
            </p>
          )}

          <div className="cta-row">
            <button className="btn btn-ghost-dark" onClick={() => setStep(3)}>
              {t('report.back')}
            </button>
            <button className="btn btn-gold" onClick={goFromPrivacy}>
              {t('report.next')}
            </button>
          </div>
        </div>
      )}

      {step === 5 && mode && place && (
        <div>
          <h2>{t('report.reviewTitle')}</h2>
          <dl className="summary">
            <dt>{t('report.sumMode')}</dt>
            <dd>{t(`modes.${mode}.name`)}</dd>
            <dt>{t('report.sumHazard')}</dt>
            <dd>{t(`hazards.${hazard}`)}</dd>
            <dt>{t('report.sumLocation')}</dt>
            <dd>
              {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
            </dd>
            <dt>{t('report.sumPhoto')}</dt>
            <dd>{photo ? t('report.yes') : t('report.no')}</dd>
            <dt>{t('report.sumDanger')}</dt>
            <dd>{t(`report.danger.${danger}`)}</dd>
            <dt>{t('report.sumPrivacy')}</dt>
            <dd>{t(`report.privacy.${privacy}.name`)}</dd>
          </dl>
          <p className="notice">{t('report.signalNotice')}</p>

          {formError !== '' && formError !== 'contact' && formError !== 'name' && (
            <p className="error" role="alert">
              {errorText[formError]}
            </p>
          )}

          <div className="cta-row">
            <button className="btn btn-ghost-dark" onClick={() => setStep(4)} disabled={stage === 'sending'}>
              {t('report.back')}
            </button>
            <button className="btn btn-gold" onClick={() => void submit()} disabled={stage === 'sending'}>
              {stage === 'sending' ? t('report.sending') : t('report.submit')}
            </button>
          </div>
          <p className="hint">
            <Link to="/emergency">{t('report.emergencyHint')}</Link>
          </p>
        </div>
      )}
    </section>
  )
}
