/**
 * Format registry and exports - Phase 1 Complete
 */
import { formatRegistry } from './SubtitleFormat.js';
import { SubRip } from './SubRip.js';
import { WebVTT } from './WebVTT.js';
import { AdvancedSubStationAlpha } from './AdvancedSubStationAlpha.js';
import { SubStationAlpha } from './SubStationAlpha.js';
import { SAMI } from './SAMI.js';
import { MicroDVD } from './MicroDVD.js';
import { TimedText10 } from './TimedText10.js';
import { JsonSubtitle } from './JsonSubtitle.js';

// Register all formats (order matters - most common first)
formatRegistry.register(new SubRip());
formatRegistry.register(new WebVTT());
formatRegistry.register(new AdvancedSubStationAlpha());
formatRegistry.register(new SubStationAlpha());
formatRegistry.register(new SAMI());
formatRegistry.register(new MicroDVD());
formatRegistry.register(new TimedText10());
formatRegistry.register(new JsonSubtitle());

export { formatRegistry };
export { SubRip } from './SubRip.js';
export { WebVTT } from './WebVTT.js';
export { AdvancedSubStationAlpha } from './AdvancedSubStationAlpha.js';
export { SubStationAlpha } from './SubStationAlpha.js';
export { SAMI } from './SAMI.js';
export { MicroDVD } from './MicroDVD.js';
export { TimedText10 } from './TimedText10.js';
export { JsonSubtitle } from './JsonSubtitle.js';
export { SubtitleFormat } from './SubtitleFormat.js';
