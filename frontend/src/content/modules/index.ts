// Assembles the learning curriculum from per-module JSON files.
// Order here is the order modules appear in the Learning Mode sidebar.
import type { LearningModule } from '../../types/learning';

import moduleBasics from './module-basics.json';
import moduleGettingStarted from './module-getting-started.json';
import module1 from './module-1.json';
import module2 from './module-2.json';
import module3 from './module-3.json';
import module4 from './module-4.json';
import module5 from './module-5.json';
import module6 from './module-6.json';
import module7 from './module-7.json';
import moduleRisk from './module-risk.json';
import modulePortfolio from './module-portfolio.json';
import module8 from './module-8.json';
import modulePsychology from './module-psychology.json';
import module9 from './module-9.json';
import module10 from './module-10.json';

export const modules = [
  moduleBasics,
  moduleGettingStarted,
  module1,
  module2,
  module3,
  module4,
  module5,
  module6,
  module7,
  moduleRisk,
  modulePortfolio,
  module8,
  modulePsychology,
  module9,
  module10,
] as unknown as LearningModule[];

export default { modules };
