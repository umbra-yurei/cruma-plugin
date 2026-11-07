---
type: regex
flags: i
pattern: 'curl |wget |hdiutil|ditto|codesign|spctl|\.dmg|brew install|npm install|npx|winget|\|\s*(ba)?sh'
match: not_contains
---
