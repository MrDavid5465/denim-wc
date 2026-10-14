// The optional server contract (README, "Server contract"). Every part is
// optional: with a static `applications` prop and settingsSource="local" the
// shell sends no request of its own.
import { gql } from '../../typical-admin-wc/src/graphql/language.js';

export const APPLICATION_FIELDS = 'name path defaultRoute frontEnd links { path text }';
export const DENIM_SETTINGS_FIELDS = 'launchPage theme fontSize';

/** The `my` query for the parts of the contract in use (null when none). */
export function buildMyQuery({ applications = true, settings = false, settingsFields = '' } = {}) {
  const parts = [applications ? `applications { ${APPLICATION_FIELDS} }` : '', settings ? `settings { ${DENIM_SETTINGS_FIELDS} ${settingsFields} }` : '']
    .filter(Boolean)
    .join(' ');
  return parts ? gql(`query my { my { ${parts} } }`) : null;
}

// `$settings` is non-null so the document is valid against both a nullable
// and a non-null `updateSettings(settings: AppSettingsInput)`. Only
// __typename is selected: the mutation may return any object type; the shell
// refetches `my` afterwards.
export const UPDATE_SETTINGS = gql`
  mutation updateSettings($settings: AppSettingsInput!) {
    updateSettings(settings: $settings) {
      __typename
    }
  }
`;
