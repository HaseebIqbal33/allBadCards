import {PreferencesDataStore} from "../DataStore/PreferencesDataStore";
import "./audiocontext-monkeypatch";

window["AudioContext"] = window["AudioContext"] || {fake: true};

class _AudioUtils
{
	public static Instance = new _AudioUtils();

	// @ts-ignore
	private ctx: AudioContext;

	constructor()
	{
		if(!AudioContext || (window["AudioContext"] as any)?.fake)
		{
			return;
		}
		// @ts-ignore
	}

	public makeSound(wave: OscillatorType = "sine", freq = 840, duration = 1)
	{
		if(PreferencesDataStore.state.muted || (window["AudioContext"] as any)?.fake)
		{
			return;
		}

		this.ctx = new AudioContext();
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();
		osc.connect(gain);
		osc.type = wave;
		osc.frequency.value = freq;
		gain.connect(this.ctx.destination);
		osc.start(0);
		gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.00001, this.ctx.currentTime + duration);
	}

	public multiTone = (count: number) =>
	{
		for(let i = 0; i < count; i++)
		{
			setTimeout(() =>
				this.makeSound(
					"sine",
					840 + (i * 200),
					1.5
				), i * 150);
		}
	}
}

export const AudioUtils = _AudioUtils.Instance;