import { CtorT } from '../../core/ctor';
import { TemplateService } from '../../services/template.service';

export type ViewsMetadataT = {
    fileRoot?: string,
    engine: CtorT<TemplateService> | string | null;
};
