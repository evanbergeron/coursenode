import json

class Course(object):
    def __init__(self, name, number, units, description, prereqs, coreqs):
        self.name = name
        self.number = number # Actually a string
        self.units = units
        self.description = description
        self.prereqs = prereqs
        self.coreqs = coreqs

    def __str__(self):
        return self.number

courses = eval(open("lib/courseDictionary","r").read())

for course in courses:
    course = courses[course]
    print [course.name, course.number, course.units, course.prereqs]

# print(json.dumps(courses))
