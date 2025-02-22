import type { AppSimpleEditFormType } from '../app/type';
import { FlowNodeTypeEnum } from '../module/node/constant';
import { ModuleOutputKeyEnum, ModuleInputKeyEnum } from '../module/constants';
import type { FlowNodeInputItemType } from '../module/node/type.d';
import { getGuideModule, splitGuideModule } from '../module/utils';
import { defaultChatModels } from '../ai/model';
import { ModuleItemType } from '../module/type.d';

export const getDefaultAppForm = (templateId = 'fastgpt-universal'): AppSimpleEditFormType => {
  const defaultChatModel = defaultChatModels[0];

  return {
    templateId,
    aiSettings: {
      model: defaultChatModel?.model,
      systemPrompt: '',
      temperature: 0,
      isResponseAnswerText: true,
      quotePrompt: '',
      quoteTemplate: '',
      maxToken: defaultChatModel ? defaultChatModel.maxResponse / 2 : 4000
    },
    dataset: {
      datasets: [],
      similarity: 0.4,
      limit: 5,
      searchEmptyText: '',
      rerank: false
    },
    userGuide: {
      welcomeText: '',
      variables: [],
      questionGuide: false,
      tts: {
        type: 'web'
      }
    }
  };
};

/* format app modules to edit form */
export const appModules2Form = ({
  templateId,
  modules
}: {
  modules: ModuleItemType[];
  templateId: string;
}) => {
  const defaultAppForm = getDefaultAppForm(templateId);

  const findInputValueByKey = (inputs: FlowNodeInputItemType[], key: string) => {
    return inputs.find((item) => item.key === key)?.value;
  };

  modules.forEach((module) => {
    if (module.flowType === FlowNodeTypeEnum.chatNode) {
      defaultAppForm.aiSettings.model = findInputValueByKey(
        module.inputs,
        ModuleInputKeyEnum.aiModel
      );
      defaultAppForm.aiSettings.systemPrompt = findInputValueByKey(
        module.inputs,
        ModuleInputKeyEnum.aiSystemPrompt
      );
      defaultAppForm.aiSettings.temperature = findInputValueByKey(
        module.inputs,
        ModuleInputKeyEnum.aiChatTemperature
      );
      defaultAppForm.aiSettings.maxToken = findInputValueByKey(
        module.inputs,
        ModuleInputKeyEnum.aiChatMaxToken
      );
      defaultAppForm.aiSettings.quoteTemplate = findInputValueByKey(
        module.inputs,
        ModuleInputKeyEnum.aiChatQuoteTemplate
      );
      defaultAppForm.aiSettings.quotePrompt = findInputValueByKey(
        module.inputs,
        ModuleInputKeyEnum.aiChatQuoteTemplate
      );
    } else if (module.flowType === FlowNodeTypeEnum.datasetSearchNode) {
      defaultAppForm.dataset.datasets = findInputValueByKey(
        module.inputs,
        ModuleInputKeyEnum.datasetSelectList
      );
      defaultAppForm.dataset.similarity = findInputValueByKey(
        module.inputs,
        ModuleInputKeyEnum.datasetSimilarity
      );
      defaultAppForm.dataset.limit = findInputValueByKey(
        module.inputs,
        ModuleInputKeyEnum.datasetLimit
      );
      defaultAppForm.dataset.rerank = findInputValueByKey(
        module.inputs,
        ModuleInputKeyEnum.datasetStartReRank
      );

      // empty text
      const emptyOutputs =
        module.outputs.find((item) => item.key === ModuleOutputKeyEnum.datasetIsEmpty)?.targets ||
        [];
      const emptyOutput = emptyOutputs[0];
      if (emptyOutput) {
        const target = modules.find((item) => item.moduleId === emptyOutput.moduleId);
        defaultAppForm.dataset.searchEmptyText =
          target?.inputs?.find((item) => item.key === ModuleInputKeyEnum.answerText)?.value || '';
      }
    } else if (module.flowType === FlowNodeTypeEnum.userGuide) {
      const { welcomeText, variableModules, questionGuide, ttsConfig } = splitGuideModule(
        getGuideModule(modules)
      );
      defaultAppForm.userGuide = {
        welcomeText: welcomeText,
        variables: variableModules,
        questionGuide: questionGuide,
        tts: ttsConfig
      };
    }
  });

  return defaultAppForm;
};
