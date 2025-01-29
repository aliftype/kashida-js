import unicodedata
from urllib import request

# URL of the ArabicShaping.txt file
url = "https://www.unicode.org/Public/UCD/latest/ucd/ArabicShaping.txt"

# Download the file
response = request.urlopen(url)
data = response.read().decode("utf-8")


JOINING_TYPES = {
    "R": "Right_Joining",
    "L": "Left_Joining",
    "D": "Dual_Joining",
    "C": "Join_Causing",
    "U": "Non_Joining",
    "T": "Transparent",
}

JOINING_GROUPS = set()

JOINING_GROUP = []
JOINING_TYPE = []

SKIP_JONING_GROUPS = {
    "Alaph",
    "Beth",
    "Dalath_Rish",
    "E",
    "Fe",
    "Final_Semkath",
    "Gamal",
    "Hanifi_Rohingya_Kinna_Ya",
    "Hanifi_Rohingya_Pa",
    "He",
    "Heth",
    "Kaph",
    "Khaph",
    "Lamadh",
    "Malayalam_Bha",
    "Malayalam_Ja",
    "Malayalam_Lla",
    "Malayalam_Llla",
    "Malayalam_Nga",
    "Malayalam_Nna",
    "Malayalam_Nnna",
    "Malayalam_Nya",
    "Malayalam_Ra",
    "Malayalam_Ssa",
    "Malayalam_Tta",
    "Manichaean_Aleph",
    "Manichaean_Ayin",
    "Manichaean_Beth",
    "Manichaean_Daleth",
    "Manichaean_Dhamedh",
    "Manichaean_Five",
    "Manichaean_Gimel",
    "Manichaean_Heth",
    "Manichaean_Hundred",
    "Manichaean_Kaph",
    "Manichaean_Lamedh",
    "Manichaean_Mem",
    "Manichaean_Nun",
    "Manichaean_One",
    "Manichaean_Pe",
    "Manichaean_Qoph",
    "Manichaean_Resh",
    "Manichaean_Sadhe",
    "Manichaean_Samekh",
    "Manichaean_Taw",
    "Manichaean_Ten",
    "Manichaean_Teth",
    "Manichaean_Thamedh",
    "Manichaean_Twenty",
    "Manichaean_Waw",
    "Manichaean_Yodh",
    "Manichaean_Zayin",
    "Mim",
    "No_Joining_Group",
    "Nun",
    "Pe",
    "Qaph",
    "Reversed_Pe",
    "Rohingya_Yeh",
    "Sadhe",
    "Semkath",
    "Shin",
    "Straight_Waw",
    "Syriac_Waw",
    "Taw",
    "Teth",
    "Yudh",
    "Yudh_He",
    "Zain",
    "Zhain",
}

# Process the file
for line in data.splitlines():
    # Skip comments and empty lines
    if line.startswith("#") or not line.strip():
        continue

    # Split the line into fields
    fields = line.split(";")
    code_point = fields[0].strip()
    name = fields[1].strip()
    joining_type = JOINING_TYPES[fields[2].strip()]
    joining_group = fields[3].strip()

    char = chr(int(code_point, 16))

    if unicodedata.bidirectional(char) != "AL":
        continue

    if joining_group != "No_Joining_Group":
        joining_group = joining_group.title().replace(" ", "_")

    if char.isprintable():
        comment = f'// {name} "{char}"'
    else:
        comment = f"// {name}"

    JOINING_TYPE.append(f"0x{code_point}: JoiningType.{joining_type}, {comment}")

    if joining_group not in SKIP_JONING_GROUPS:
        JOINING_GROUPS.add(joining_group)
        JOINING_GROUP.append(f"0x{code_point}: JoiningGroup.{joining_group}, {comment}")

# Generate the Python code for the dictionaries
GROUPS = []
for jg in sorted(JOINING_GROUPS):
    GROUPS.append(f"{jg}: '{jg}'")

print(f"""
// Generated code DO NOT EDIT

export const JoiningType = {{
  Right_Joining: "R",
  Left_Joining: "L",
  Dual_Joining: "D",
  Join_Causing: "C",
  Non_Joining: "U",
  Transparent: "T",
}};

export const JoiningGroup = {{
  {",\n  ".join(GROUPS)}
}};

export const JOINING_TYPE = {{
  {",\n  ".join(JOINING_TYPE)}
}};

export const JOINING_GROUP = {{
  {",\n  ".join(JOINING_GROUP)}
}};
""")
