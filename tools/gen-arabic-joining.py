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

    if joining_group != "No_Joining_Group":
        joining_group = joining_group.title().replace(" ", "_")
    JOINING_GROUPS.add(joining_group)

    char = chr(int(code_point, 16))
    if char.isprintable():
        comment = f'// {name} "{char}"'
    else:
        comment = f"// {name}"

    JOINING_TYPE.append(f"0x{code_point}: JoiningType.{joining_type}, {comment}")
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
