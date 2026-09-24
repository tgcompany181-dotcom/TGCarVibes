'use client';

import { useState, useTransition } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { CATEGORIES } from '@/lib/config';
import type { Car } from '@/lib/types';
import { saveCar } from '../../actions';

export function CarDialog({ car, onClose }: { car: Car | null; onClose: () => void }) {
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const flash = useToast();

  const submit = (form: FormData) =>
    start(async () => {
      const res = await saveCar(car?.id ?? null, form);
      if (!res.ok) return setError(res.error);
      flash(car ? 'Car updated' : `${String(form.get('plate') || form.get('model')).toUpperCase()} added to fleet`);
      onClose();
    });

  return (
    <Dialog onClose={onClose} width={520} labelledBy="car-dialog-title">
      <div id="car-dialog-title" className="dialog-title">
        {car ? `Edit ${car.model} ${car.year}` : 'Add a car'}
      </div>
      <form action={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="form-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <div className="field">
            <label htmlFor="model">Model</label>
            <input id="model" name="model" className="input" defaultValue={car?.model} placeholder="Toyota Camry" required />
          </div>
          <div className="field">
            <label htmlFor="year">Year</label>
            <input id="year" name="year" className="input" inputMode="numeric" defaultValue={car?.year ?? ''} placeholder="2016" required />
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="category">Type</label>
            <select id="category" name="category" className="input" defaultValue={car?.category ?? 'Sedan'}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="seats">Seats</label>
            <input id="seats" name="seats" className="input" inputMode="numeric" defaultValue={car?.seats ?? 5} />
          </div>
          <div className="field">
            <label htmlFor="bags">Bags</label>
            <input id="bags" name="bags" className="input" defaultValue={car?.bags ?? '3'} />
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="plate">Plate</label>
            <input id="plate" name="plate" className="input" defaultValue={car?.plate ?? ''} placeholder="ABC12D" style={{ textTransform: 'uppercase' }} />
          </div>
          <div className="field">
            <label htmlFor="weeklyRate">Rate / wk ($)</label>
            <input id="weeklyRate" name="weeklyRate" className="input" inputMode="decimal" defaultValue={car?.weeklyRate ?? ''} required />
          </div>
          <div className="field">
            <label htmlFor="odometer">Odometer (km)</label>
            <input id="odometer" name="odometer" className="input" inputMode="numeric" defaultValue={car?.odometer ?? ''} />
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="regoExpiry">Rego expiry</label>
            <input id="regoExpiry" name="regoExpiry" type="date" className="input" defaultValue={car?.regoExpiry ?? ''} />
          </div>
          <div className="field">
            <label htmlFor="serviceDue">Next service</label>
            <input id="serviceDue" name="serviceDue" type="date" className="input" defaultValue={car?.serviceDue ?? ''} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="photo">Photo {car?.photoUrl ? '(leave empty to keep the current one)' : ''}</label>
          <input id="photo" name="photo" type="file" accept="image/*" className="input" />
        </div>
        <label className="checkbox">
          <input type="checkbox" name="listed" defaultChecked={car?.listed ?? true} /> Show on the website
        </label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={pending}>
            {pending ? 'Saving…' : car ? 'Save' : 'Add to fleet'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
