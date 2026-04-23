/**
 * Sample CWE data for autocomplete tests
 * This data is loaded into localStorage to enable CWE autocomplete functionality
 */
export const cweTestData = [
  {
    id: '79',
    name: 'Improper Neutralization of Input During Web Page Generation (\'Cross-site Scripting\')',
    status: 'Stable',
    summary: 'The product does not neutralize or incorrectly neutralizes user-controllable input before it is placed in output that is used as a web page that is served to other users.',
    usage: 'Allowed',
    category: '990',
    isDiscouraged: false,
    isProhibited: false,
  },
  {
    id: '89',
    name: 'Improper Neutralization of Special Elements used in an SQL Command',
    status: 'Stable',
    summary: 'The product constructs all or part of an SQL command using externally-influenced input from an upstream component.',
    usage: 'Allowed',
    category: '990',
    isDiscouraged: false,
    isProhibited: false,
  },
  {
    id: '400',
    name: 'Uncontrolled Resource Consumption',
    status: 'Stable',
    summary: 'The product does not properly control the allocation and maintenance of a limited resource.',
    usage: 'Allowed',
    category: '399',
    isDiscouraged: false,
    isProhibited: false,
  },
];
