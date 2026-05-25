import type { CourseLine } from "./types";

export type AdvisorOption = {
  name: string;
  email: string;
};

export type ProgrammeOption = {
  programme: string;
  advisorName: string;
  advisorEmail: string;
};

export type CourseAdvisorOption = {
  courseCode: string;
  advisorName: string;
  advisorEmail: string;
  courseTitle?: string;
  crn?: string;
  lecturerName?: string;
  lecturerEmail?: string;
  campus?: string;
  section?: string;
};

export const advisorOptions: AdvisorOption[] = [
  {
    "name": "Absalom, Dexter",
    "email": "dabsalom@costaatt.edu.tt"
  },
  {
    "name": "Alexander, Nicole",
    "email": "nalexander@costaatt.edu.tt"
  },
  {
    "name": "Alexander, Taja",
    "email": "talexander@costaatt.edu.tt"
  },
  {
    "name": "Andrews, Adrian",
    "email": "aandrews@costaatt.edu.tt"
  },
  {
    "name": "AwaiKing, Sarah",
    "email": "sawai-king@costaatt.edu.tt"
  },
  {
    "name": "Bahaw, Priscilla",
    "email": "pbahaw@costaatt.edu.tt"
  },
  {
    "name": "Barclay, Rosalie",
    "email": "rbarclay@costaatt.edu.tt"
  },
  {
    "name": "BascombeMcCave, Carolyn",
    "email": "cmccave@costaatt.edu.tt"
  },
  {
    "name": "Batchasingh, Roddy",
    "email": "rbatchasingh@costaatt.edu.tt"
  },
  {
    "name": "Beard, Andre",
    "email": "bolt.storm@hotmail.com"
  },
  {
    "name": "Benjamin, Clinton",
    "email": "cbenjamin@costaatt.edu.tt"
  },
  {
    "name": "Bertrand-Charles, Ayanna",
    "email": "abcharles@costaatt.edu.tt"
  },
  {
    "name": "Bidaisee, Sheldon",
    "email": "sbidaisee@costaatt.edu.tt"
  },
  {
    "name": "Bissoo, Wayne",
    "email": "wbissoo@costaatt.edu.tt"
  },
  {
    "name": "Bovell, Nyron",
    "email": "nbovell@costaatt.edu.tt"
  },
  {
    "name": "Bremnor, Abraham",
    "email": "ABremnor@costaatt.edu.tt"
  },
  {
    "name": "Cadogan, Andre",
    "email": "acadogan@costaatt.edu.tt"
  },
  {
    "name": "Caesar Pecome, Marsha",
    "email": "mcpecome@costaatt.edu.tt"
  },
  {
    "name": "Campbell, Patrick",
    "email": "pcampbell@costaatt.edu.tt"
  },
  {
    "name": "Carter, Avril",
    "email": "acarter@costaatt.edu.tt"
  },
  {
    "name": "Charles-Harris, Abeni",
    "email": "acharles-harris@costaatt.edu.tt"
  },
  {
    "name": "Charles-Stuart, Alicia",
    "email": "acharles@costaatt.edu.tt"
  },
  {
    "name": "Chung, Roger",
    "email": "rchung@costaatt.edu.tt"
  },
  {
    "name": "Clarke, Anthea",
    "email": "aclarke@costaatt.edu.tt"
  },
  {
    "name": "Dennis-Nagee, Alicia",
    "email": "adnagee@costaatt.edu.tt"
  },
  {
    "name": "Dial, Christian",
    "email": "cdial@costaatt.edu.tt"
  },
  {
    "name": "Doonie, Angela",
    "email": "aqdoonie@costaatt.edu.tt"
  },
  {
    "name": "Dougdeen, Karen",
    "email": "kdougdeen@costaatt.edu.tt"
  },
  {
    "name": "Dyette, Raymond",
    "email": "rdyette@costaatt.edu.tt"
  },
  {
    "name": "Edwards Knox, Sophia",
    "email": "sedwards@costaatt.edu.tt"
  },
  {
    "name": "Elliot, Venessa",
    "email": "velliot@costaatt.edu.tt"
  },
  {
    "name": "Felix, Alton",
    "email": "afelix@costaatt.edu.tt"
  },
  {
    "name": "Gill-Grill, Ines",
    "email": "igill-grill@costaatt.edu.tt"
  },
  {
    "name": "Gokool, Maneka",
    "email": "mgokool@costaatt.edu.tt"
  },
  {
    "name": "Gonzales, Nadine",
    "email": "NGonzales@costaatt.edu.tt"
  },
  {
    "name": "Gouveia Ferguson, Julie",
    "email": "jferguson@costaatt.edu.tt"
  },
  {
    "name": "Guzman, Abigail",
    "email": "aguzman@costaatt.edu.tt"
  },
  {
    "name": "Hamid, Sajjad",
    "email": "shamid@costaatt.edu.tt"
  },
  {
    "name": "Humphrey, Melina",
    "email": "mhumphrey@costaatt.edu.tt"
  },
  {
    "name": "Hypolite, Michelle",
    "email": "mhypolite@costaatt.edu.tt"
  },
  {
    "name": "Jack, Clarinda",
    "email": "cjack@costaatt.edu.tt"
  },
  {
    "name": "James, Kayode",
    "email": "kjames@costaatt.edu.tt"
  },
  {
    "name": "Jarvis-Patrick, Joanne",
    "email": "jjpatrick@costaatt.edu.tt"
  },
  {
    "name": "JarvisIsaac, Rita",
    "email": "rjisaac@costaatt.edu.tt"
  },
  {
    "name": "Joefield-Lovell, Sharleen",
    "email": "sjoefield-lovell@costaatt.edu.tt"
  },
  {
    "name": "Julien, Rahet",
    "email": "rjulien@costaatt.edu.tt"
  },
  {
    "name": "Kalloo, Risha",
    "email": "rkalloo@costaatt.edu.tt"
  },
  {
    "name": "Karim, Riaz",
    "email": "RKarim@costaatt.edu.tt"
  },
  {
    "name": "Kendall-DeSilva, Kim",
    "email": "kkdesilva@costaatt.edu.tt"
  },
  {
    "name": "Khan, Jerome",
    "email": "jkhan@costaatt.edu.tt"
  },
  {
    "name": "King, Keron",
    "email": "kking@costaatt.edu.tt"
  },
  {
    "name": "Kissoon-Weekes, Jinelle",
    "email": "jkissoon-weekes@costaatt.edu.tt"
  },
  {
    "name": "Kokaram, John Jason",
    "email": "jkokaram@costaatt.edu.tt"
  },
  {
    "name": "LaCoa, Kizzi",
    "email": "klacoa@costaatt.edu.tt"
  },
  {
    "name": "Lala, Anthony",
    "email": "alalla@costaatt.edu.tt"
  },
  {
    "name": "Laltoo, Sochan",
    "email": "slaltoo@costaatt.edu.tt"
  },
  {
    "name": "LaRose, Hamere",
    "email": "hlarose@costaatt.edu.tt"
  },
  {
    "name": "Leela, Jeffrey",
    "email": "jleela@costaatt.edu.tt"
  },
  {
    "name": "Lezama, Danelle",
    "email": "dlezama@costaatt.edu.tt"
  },
  {
    "name": "Mahase, Radica",
    "email": "rmahase@costaatt.edu.tt"
  },
  {
    "name": "Maurice, Brian",
    "email": "bmaurice@costaatt.edu.tt"
  },
  {
    "name": "Maynard, Jeffrey",
    "email": "jmaynard@costaatt.edu.tt"
  },
  {
    "name": "Mc Gowan-Santana, Kyra",
    "email": "kmsantana@costaatt.edu.tt"
  },
  {
    "name": "Mc Pherson-Baptiste, Delka",
    "email": "dmcphersonbaptiste@costaatt.edu.tt"
  },
  {
    "name": "McIntosh, Tricia",
    "email": "tmcintosh@costaatt.edu.tt"
  },
  {
    "name": "Medine, Ambica",
    "email": "amedine@costaatt.edu.tt"
  },
  {
    "name": "Metivier-Carrington, Gail",
    "email": "gmetivier-carrington@costaatt.edu.tt"
  },
  {
    "name": "Mir, Ruhee",
    "email": "rmir@costaatt.edu.tt"
  },
  {
    "name": "Mitchell, Michelle",
    "email": "mmitchell@costaatt.edu.tt"
  },
  {
    "name": "Mohammed, Jeffrey",
    "email": "jmohammed@costaatt.edu.tt"
  },
  {
    "name": "Mohess, Yatasha",
    "email": "ymohess@costaatt.edu.tt"
  },
  {
    "name": "Mooteeram, Arlene",
    "email": "AMooteeram@costaatt.edu.tt"
  },
  {
    "name": "Mungaldeen, Charmaine",
    "email": "cmungaldeen@costaatt.edu.tt"
  },
  {
    "name": "Munroe, Anderson",
    "email": "amunroe@costaatt.edu.tt"
  },
  {
    "name": "Murphy, David",
    "email": "DMurphy@costaatt.edu.tt"
  },
  {
    "name": "Nelson, Vanessa",
    "email": "vnelson@costaatt.edu.tt"
  },
  {
    "name": "NgWai, Sean",
    "email": "sngwai@costaatt.edu.tt"
  },
  {
    "name": "Nurse Carrington, Ayinka",
    "email": "ancarrington@costaatt.edu.tt"
  },
  {
    "name": "Ojoade, Oyetayo",
    "email": "oojoade@costaatt.edu.tt"
  },
  {
    "name": "Olton, Romona",
    "email": "rolton@costaatt.edu.tt"
  },
  {
    "name": "Paul, Karen",
    "email": "kpaul@costaatt.edu.tt"
  },
  {
    "name": "Persad, Rangie",
    "email": "raspersad@costaatt.edu.tt"
  },
  {
    "name": "Peters, Kevin",
    "email": "kpeters@costaatt.edu.tt"
  },
  {
    "name": "Phillip, Tamara",
    "email": "tmphillip@costaatt.edu.tt"
  },
  {
    "name": "Pierre, Joanne",
    "email": "jpierre@costaatt.edu.tt"
  },
  {
    "name": "Pooran-Roodal, Mervyn",
    "email": "mpooran-roodal@costaatt.edu.tt"
  },
  {
    "name": "PoyWing, Nancy",
    "email": "npoywing@costaatt.edu.tt"
  },
  {
    "name": "Pyle-Williams, Kirwin",
    "email": "kpwilliams@costaatt.edu.tt"
  },
  {
    "name": "Rajnauth, Natasha",
    "email": "NRajnauth@costaatt.edu.tt"
  },
  {
    "name": "Rambaran, Amrika",
    "email": "arambaran@costaatt.edu.tt"
  },
  {
    "name": "Ramdial-Sookan, Parvati",
    "email": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "name": "Ramlal-Chirkoot, Lalita",
    "email": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "name": "Ramlal, Laura",
    "email": "lramlal@costaatt.edu.tt"
  },
  {
    "name": "Ramlal, Robin",
    "email": "rramlal@costaatt.edu.tt"
  },
  {
    "name": "Rampersad, Ravi",
    "email": "rrampersad@costaatt.edu.tt"
  },
  {
    "name": "Ramsundar, Giselle",
    "email": "gramsundar@costaatt.edu.tt"
  },
  {
    "name": "Roopnarine, Hema",
    "email": "hroopnarine@costaatt.edu.tt"
  },
  {
    "name": "Ryan, Jennifer",
    "email": "jryan@costaatt.edu.tt"
  },
  {
    "name": "Santiago, Ferlin",
    "email": "fsantiago@costaatt.edu.tt"
  },
  {
    "name": "Sattar, Saeeda",
    "email": "ssattar@costaatt.edu.tt"
  },
  {
    "name": "Sealey, Heather-Dawn",
    "email": "hsealey@costaatt.edu.tt"
  },
  {
    "name": "Seenarine, Shireen",
    "email": "sseenarine@costaatt.edu.tt"
  },
  {
    "name": "Singh, Anurada",
    "email": "asingh@costaatt.edu.tt"
  },
  {
    "name": "Smith, Shinelle",
    "email": "ssmith@costaatt.edu.tt"
  },
  {
    "name": "Soogrim, Carlton",
    "email": "csoogrim@costaatt.edu.tt"
  },
  {
    "name": "St Rose, Nneka",
    "email": "nsrose@costaatt.edu.tt"
  },
  {
    "name": "Sterling, Job",
    "email": "jsterling@costaatt.edu.tt"
  },
  {
    "name": "Stewart-Ache, Antoinette",
    "email": "asashe@costaatt.edu.tt"
  },
  {
    "name": "Stoute, Tracey",
    "email": "tstoute@costaatt.edu.tt"
  },
  {
    "name": "Sylvester, Neil",
    "email": "nsylvester@costaatt.edu.tt"
  },
  {
    "name": "Syne, Susan",
    "email": "ssyne@costaatt.edu.tt"
  },
  {
    "name": "Tobas, Jesinta",
    "email": "jtobas@costaatt.edu.tt"
  },
  {
    "name": "Virgil, Christian",
    "email": "cvirgil@costaatt.edu.tt"
  },
  {
    "name": "Walker, Alicia",
    "email": "awalker@costaatt.edu.tt"
  },
  {
    "name": "Warner, Adana",
    "email": "awarner@costaatt.edu.tt"
  },
  {
    "name": "Whiskey, Indra",
    "email": "iwhiskey@costaatt.edu.tt"
  },
  {
    "name": "Williams, Stacy",
    "email": "skwilliams@costaatt.edu.tt"
  },
  {
    "name": "Wills, Nicole",
    "email": "nwills@costaatt.edu.tt"
  }
];

export const programmeOptions: ProgrammeOption[] = [
  {
    "programme": "10565",
    "advisorName": "Fundamentals of Accounting",
    "advisorEmail": "ManagementandEntrepreneurship@costaatt.edu.tt"
  },
  {
    "programme": "AA - Early Childhood Care and Ed",
    "advisorName": "Neil Sylvester",
    "advisorEmail": "nsylvester@costaatt.edu.tt"
  },
  {
    "programme": "AA - Film and Video Production",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "programme": "AA - Journalism",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "programme": "AA - Languages",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "programme": "AA - Literatures in English",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "NGonzales@costaatt.edu.tt"
  },
  {
    "programme": "AA - Performing Arts-Percussion",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "ngonzales@costaatt.edu.tt"
  },
  {
    "programme": "AA - Performing Arts: Music",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "ngonzales@costaatt.edu.tt"
  },
  {
    "programme": "AA - Performing Arts:Music (Brass)",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "ngonzales@costaatt.edu.tt"
  },
  {
    "programme": "AA - Performing Arts:Music (Guitar)",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "ngonzales@costaatt.edu.tt"
  },
  {
    "programme": "AA - Performing Arts:Music (Pan)",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "ngonzales@costaatt.edu.tt"
  },
  {
    "programme": "AA - Performing Arts:Music (Piano)",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "ngonzales@costaatt.edu.tt"
  },
  {
    "programme": "AA - Performing Arts:Music (Voice)",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "ngonzales@costaatt.edu.tt"
  },
  {
    "programme": "AA - Performing Arts:Music (Wind)",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "ngonzales@costaatt.edu.tt"
  },
  {
    "programme": "AA - Psychology",
    "advisorName": "Neil Sylvester",
    "advisorEmail": "SocialandBehaviouralSciences@costaatt.edu.tt"
  },
  {
    "programme": "AA - Sociology",
    "advisorName": "Neil Sylvester",
    "advisorEmail": "SocialandBehaviouralSciences@costaatt.edu.tt"
  },
  {
    "programme": "AA - Spanish",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Advertising and Promotions",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Basic General Nursing",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Basic Psychiatric Nursing",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Business Administration",
    "advisorName": "Heather-Dawn Sealey",
    "advisorEmail": "ManagementandEntrepreneurship@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Business Management",
    "advisorName": "Heather-Dawn Sealey",
    "advisorEmail": "ManagementandEntrepreneurship@costaatt.edu.tt"
  },
  {
    "programme": "AAS - CAT Reporting",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Criminal Justice",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kpwilliams@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Environmental Engineering",
    "advisorName": "Karen Paul",
    "advisorEmail": "kpaul@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Environmental Health",
    "advisorName": "Karen Paul",
    "advisorEmail": "kpaul@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Environmental Management",
    "advisorName": "Karen Paul",
    "advisorEmail": "kpaul@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Environmental Technology",
    "advisorName": "Karen Paul",
    "advisorEmail": "kpaul@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Foreign Languages for Business",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Forestry",
    "advisorName": "Karen Paul",
    "advisorEmail": "kpaul@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Geographic Information Systems",
    "advisorName": "Karen Paul",
    "advisorEmail": "kpaul@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Graphic Design",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Human Resource Management",
    "advisorName": "Heather-Dawn Sealey",
    "advisorEmail": "ManagementandEntrepreneurship@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Information Technology",
    "advisorName": "Roger Chung",
    "advisorEmail": "IST@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Information Technology-General",
    "advisorName": "Roger Chung",
    "advisorEmail": "IST@costaatt.edu.tt"
  },
  {
    "programme": "AAS - IT-Information Systems Dev",
    "advisorName": "Roger Chung",
    "advisorEmail": "IST@costaatt.edu.tt"
  },
  {
    "programme": "AAS - IT-Information Systems Mgmt",
    "advisorName": "Roger Chung",
    "advisorEmail": "IST@costaatt.edu.tt"
  },
  {
    "programme": "AAS - IT-Internet Technology",
    "advisorName": "Roger Chung",
    "advisorEmail": "IST@costaatt.edu.tt"
  },
  {
    "programme": "AAS - IT-Operating Systems Mgmt",
    "advisorName": "Roger Chung",
    "advisorEmail": "IST@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Journalism/Public Relations",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Library and Inform Studies",
    "advisorName": "Roger Chung",
    "advisorEmail": "IST@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Management Information Systems",
    "advisorName": "Roger Chung",
    "advisorEmail": "IST@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Management with Accounting",
    "advisorName": "Heather-Dawn Sealey",
    "advisorEmail": "ManagementandEntrepreneurship@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Marketing",
    "advisorName": "Heather-Dawn Sealey",
    "advisorEmail": "ManagementandEntrepreneurship@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Medical Laboratory Technology",
    "advisorName": "Anthony Lalla",
    "advisorEmail": "MCC-HealthScienceTechnologies@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Occupational Safety and Health",
    "advisorName": "Karen Paul",
    "advisorEmail": "kpaul@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Office Administration",
    "advisorName": "Heather-Dawn Sealey",
    "advisorEmail": "ManagementandEntrepreneurship@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Operating Systems Management",
    "advisorName": "Roger Chung",
    "advisorEmail": "IST@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Paralegal Studies",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kpwilliams@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Radiological Sciences",
    "advisorName": "Anthony Lalla",
    "advisorEmail": "MCC-HealthScienceTechnologies@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Social Work",
    "advisorName": "Neil Sylvester",
    "advisorEmail": "SocialandBehaviouralSciences@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Sociology",
    "advisorName": "Neil Sylvester",
    "advisorEmail": "SocialandBehaviouralSciences@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Water Resource Mgmt&Technology",
    "advisorName": "Karen Paul",
    "advisorEmail": "kpaul@costaatt.edu.tt"
  },
  {
    "programme": "AAS - Water&WasteWater Mgmt Srv&Tec",
    "advisorName": "Karen Paul",
    "advisorEmail": "kpaul@costaatt.edu.tt"
  },
  {
    "programme": "ABS - Applied Psychology",
    "advisorName": "Neil Sylvester",
    "advisorEmail": "SocialandBehaviouralSciences@costaatt.edu.tt"
  },
  {
    "programme": "ADIP - Food Inspection",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "ADIP - Midwifery",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "programme": "ADIP - Port Health",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "ADIP - Ultrasound",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "programme": "ADIP - Vector Control",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "AS - Basic General Nursing",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "programme": "AS - Basic Psychiatric Nursing",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "programme": "AS - Biology",
    "advisorName": "Delamae Wilson",
    "advisorEmail": "DWilson@costaatt.edu.tt"
  },
  {
    "programme": "AS - Business Management",
    "advisorName": "Heather-Dawn Sealey",
    "advisorEmail": "ManagementandEntrepreneurship@costaatt.edu.tt"
  },
  {
    "programme": "AS - Chemistry",
    "advisorName": "Delamae Wilson",
    "advisorEmail": "DWilson@costaatt.edu.tt"
  },
  {
    "programme": "AS - Computer Science",
    "advisorName": "Roger Chung",
    "advisorEmail": "IST@costaatt.edu.tt"
  },
  {
    "programme": "AS - Earth Science",
    "advisorName": "Karen Paul",
    "advisorEmail": "kpaul@costaatt.edu.tt"
  },
  {
    "programme": "AS - Environmental Health",
    "advisorName": "Karen Paul",
    "advisorEmail": "kpaul@costaatt.edu.tt"
  },
  {
    "programme": "AS - Geography",
    "advisorName": "Karen Paul",
    "advisorEmail": "kpaul@costaatt.edu.tt"
  },
  {
    "programme": "AS - History",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "NGonzales@costaatt.edu.tt"
  },
  {
    "programme": "AS - Information Technology",
    "advisorName": "Roger Chung",
    "advisorEmail": "IST@costaatt.edu.tt"
  },
  {
    "programme": "AS - Management",
    "advisorName": "Heather-Dawn Sealey",
    "advisorEmail": "ManagementandEntrepreneurship@costaatt.edu.tt"
  },
  {
    "programme": "AS - Management Information Systems",
    "advisorName": "Roger Chung",
    "advisorEmail": "IST@costaatt.edu.tt"
  },
  {
    "programme": "AS - Management with Accounting",
    "advisorName": "Heather-Dawn Sealey",
    "advisorEmail": "ManagementandEntrepreneurship@costaatt.edu.tt"
  },
  {
    "programme": "AS - Marketing",
    "advisorName": "Heather-Dawn Sealey",
    "advisorEmail": "ManagementandEntrepreneurship@costaatt.edu.tt"
  },
  {
    "programme": "AS - Mathematics",
    "advisorName": "Neil Sylvester",
    "advisorEmail": "Mathematics@costaatt.edu.tt"
  },
  {
    "programme": "AS - Mgmt Studies - Protective Serv",
    "advisorName": "Heather-Dawn Sealey",
    "advisorEmail": "ManagementandEntrepreneurship@costaatt.edu.tt"
  },
  {
    "programme": "AS - Physics",
    "advisorName": "Delamae Wilson",
    "advisorEmail": "DWilson@costaatt.edu.tt"
  },
  {
    "programme": "AS - Police Science",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kpwilliams@costaatt.edu.tt"
  },
  {
    "programme": "AS - Psychology",
    "advisorName": "Neil Sylvester",
    "advisorEmail": "SocialandBehaviouralSciences@costaatt.edu.tt"
  },
  {
    "programme": "AS - Radiological Sciences",
    "advisorName": "Anthony Lalla",
    "advisorEmail": "MCC-HealthScienceTechnologies@costaatt.edu.tt"
  },
  {
    "programme": "AS - Sociology",
    "advisorName": "Neil Sylvester",
    "advisorEmail": "SocialandBehaviouralSciences@costaatt.edu.tt"
  },
  {
    "programme": "BA - Accounting",
    "advisorName": "Heather-Dawn Sealey",
    "advisorEmail": "ManagementandEntrepreneurship@costaatt.edu.tt"
  },
  {
    "programme": "BA - Advertising and Promotions",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "programme": "BA - Criminal Justice",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kpwilliams@costaatt.edu.tt"
  },
  {
    "programme": "BA - Criminal Justice: Corrections",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kpwilliams@costaatt.edu.tt"
  },
  {
    "programme": "BA - Criminal Justice:PoliceScience",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kpwilliams@costaatt.edu.tt"
  },
  {
    "programme": "BA - Early Childhood Care and Ed",
    "advisorName": "Neil Sylvester",
    "advisorEmail": "nsylvester@costaatt.edu.tt"
  },
  {
    "programme": "BA - Film and Video Production",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "NGonzales@costaatt.edu.tt"
  },
  {
    "programme": "BA - Financial Management",
    "advisorName": "Heather-Dawn Sealey",
    "advisorEmail": "ManagementandEntrepreneurship@costaatt.edu.tt"
  },
  {
    "programme": "BA - Graphic Design - BA",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "programme": "BA - History",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "NGonzales@costaatt.edu.tt"
  },
  {
    "programme": "BA - Journalism (BA)",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "programme": "BA - Latin American Studies",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "programme": "BA - Literature and Communication",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "NGonzales@costaatt.edu.tt"
  },
  {
    "programme": "BA - Mass Communication",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "programme": "BA - Spanish for Business",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "programme": "BBA - Accounting",
    "advisorName": "Heather-Dawn Sealey",
    "advisorEmail": "ManagementandEntrepreneurship@costaatt.edu.tt"
  },
  {
    "programme": "BBA - Business Administration",
    "advisorName": "Heather-Dawn Sealey",
    "advisorEmail": "ManagementandEntrepreneurship@costaatt.edu.tt"
  },
  {
    "programme": "BBA - Financial Management",
    "advisorName": "Heather-Dawn Sealey",
    "advisorEmail": "ManagementandEntrepreneurship@costaatt.edu.tt"
  },
  {
    "programme": "BBA - Human Resource Management",
    "advisorName": "Heather-Dawn Sealey",
    "advisorEmail": "ManagementandEntrepreneurship@costaatt.edu.tt"
  },
  {
    "programme": "BBA - Management & Entrepreneurship",
    "advisorName": "Heather-Dawn Sealey",
    "advisorEmail": "ManagementandEntrepreneurship@costaatt.edu.tt"
  },
  {
    "programme": "BBA - Marketing (BBA)",
    "advisorName": "Heather-Dawn Sealey",
    "advisorEmail": "ManagementandEntrepreneurship@costaatt.edu.tt"
  },
  {
    "programme": "BBA - Public Sector Management",
    "advisorName": "Heather-Dawn Sealey",
    "advisorEmail": "ManagementandEntrepreneurship@costaatt.edu.tt"
  },
  {
    "programme": "BM - Music",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "ngonzales@costaatt.edu.tt"
  },
  {
    "programme": "BM - Music - Brass",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "ngonzales@costaatt.edu.tt"
  },
  {
    "programme": "BM - Music - Guitar",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "ngonzales@costaatt.edu.tt"
  },
  {
    "programme": "BM - Music - Percussion",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "ngonzales@costaatt.edu.tt"
  },
  {
    "programme": "BM - Music - Piano",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "ngonzales@costaatt.edu.tt"
  },
  {
    "programme": "BM - Music - Steelpan",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "ngonzales@costaatt.edu.tt"
  },
  {
    "programme": "BM - Music - Voice",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "ngonzales@costaatt.edu.tt"
  },
  {
    "programme": "BM - Music - Wind",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "ngonzales@costaatt.edu.tt"
  },
  {
    "programme": "BM - Music Education",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "ngonzales@costaatt.edu.tt"
  },
  {
    "programme": "BS - Applied Psychology",
    "advisorName": "Neil Sylvester",
    "advisorEmail": "SocialandBehaviouralSciences@costaatt.edu.tt"
  },
  {
    "programme": "BS - Biology",
    "advisorName": "Delamae Wilson",
    "advisorEmail": "DWilson@costaatt.edu.tt"
  },
  {
    "programme": "BS - Biology/Pre-Med",
    "advisorName": "Delamae Wilson",
    "advisorEmail": "DWilson@costaatt.edu.tt"
  },
  {
    "programme": "BS - Dental Therapy",
    "advisorName": "Delamae Wilson",
    "advisorEmail": "DWilson@costaatt.edu.tt"
  },
  {
    "programme": "BS - Environmental Health - BSc",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "programme": "BS - Environmental Management",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "programme": "BS - General Nursing",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "programme": "BS - Geog'cal Studies for Sus Dev",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "programme": "BS - Geography",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "programme": "BS - Information & Library Science",
    "advisorName": "Roger Chung",
    "advisorEmail": "IST@costaatt.edu.tt"
  },
  {
    "programme": "BS - Information Technology-General",
    "advisorName": "Roger Chung",
    "advisorEmail": "IST@costaatt.edu.tt"
  },
  {
    "programme": "BS - International Trade & Commerce",
    "advisorName": "Roger Chung",
    "advisorEmail": "IST@costaatt.edu.tt"
  },
  {
    "programme": "BS - Internet Technology",
    "advisorName": "Roger Chung",
    "advisorEmail": "IST@costaatt.edu.tt"
  },
  {
    "programme": "BS - IT-Computer Info Systems",
    "advisorName": "Roger Chung",
    "advisorEmail": "IST@costaatt.edu.tt"
  },
  {
    "programme": "BS - IT-Internet Technology",
    "advisorName": "Roger Chung",
    "advisorEmail": "IST@costaatt.edu.tt"
  },
  {
    "programme": "BS - IT-Networking",
    "advisorName": "Roger Chung",
    "advisorEmail": "IST@costaatt.edu.tt"
  },
  {
    "programme": "BS - Latin American Studies",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "programme": "BS - Library and Info Science BSc",
    "advisorName": "Roger Chung",
    "advisorEmail": "IST@costaatt.edu.tt"
  },
  {
    "programme": "BS - Mathematics",
    "advisorName": "Adrian Andrews",
    "advisorEmail": "aandrews@costaatt.edu.tt"
  },
  {
    "programme": "BS - Medical Laboratory Technology",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "jtobas@costaatt.edu.tt"
  },
  {
    "programme": "BS - Midwifery",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "programme": "BS - Occu Safety and Health - BSc",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "programme": "BS - Psychiatric Nursing",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "jtobas@costaatt.edu.tt"
  },
  {
    "programme": "BS - Psychology",
    "advisorName": "Neil Sylvester",
    "advisorEmail": "SocialandBehaviouralSciences@costaatt.edu.tt"
  },
  {
    "programme": "BS - Radiation Therapy",
    "advisorName": "Anthony Lalla",
    "advisorEmail": "MCC-HealthScienceTechnologies@costaatt.edu.tt"
  },
  {
    "programme": "BS - Radiography",
    "advisorName": "Anthony Lalla",
    "advisorEmail": "MCC-HealthScienceTechnologies@costaatt.edu.tt"
  },
  {
    "programme": "BS - Social Work",
    "advisorName": "Neil Sylvester",
    "advisorEmail": "SocialandBehaviouralSciences@costaatt.edu.tt"
  },
  {
    "programme": "BS - Water Resources Mgmt & Tech'gy",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "programme": "BS - Water&WasteWater Mgmt Srv&Tech",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "programme": "BSW - Social Work",
    "advisorName": "Neil Sylvester",
    "advisorEmail": "SocialandBehaviouralSciences@costaatt.edu.tt"
  },
  {
    "programme": "CERT -  Cust Serv Fund -SMEs in COVID",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Accounting Fundamentals",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Accounting Systems and Apps",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Administrative Office Mgmt",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Adv Conversational Spanish",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Adv Gram Office Professionals",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Advanced Computer Literacy",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Advanced Make-up Artistry",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Advanced MS Excel",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Advanced MS PowerPoint",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Advanced MS Word",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Advertising and Promotions",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Agriculture",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Air Conditioning & Refrig",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Anat&Phys: Biomedicl Engr Tech",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Automotive Services",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Basic Computer Literacy",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Basic Computer Repairs",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Basic Coun for M'gers & S'ers",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Basic Make-up Artistry",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Basic Nail Art",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Basic Occup Safety & Health",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Basic Office Administration",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Basic Project Management",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Basic Records Management",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Basic Tour Guiding",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Basic Web Page Design",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Bookbinding",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Broadcast Newswriting",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Business and Energy Reporting",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Business Communication",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Cabinet Making",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Camera Operating & Copy Prep",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Child Development",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Cisco Certified Network Assoc",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Cnstrctn, Carpentry & Joinery",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - College Prep",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Commercial & Indus Info Sys",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Community Information Tech",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Community Mental Health",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - COMPASS Access",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - COMPASS Foundation",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Computer Foundation Tools",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Computer Literacy",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Constitutional Law",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Construction Safety",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Contract Mgmt Non-Procure Pro",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Copywriting",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Court Transcription",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Crime and the Media",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Criminal Justice - Cert.",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Criminal Law",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Critical Reading and Writing",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Customer Service Fundamentals",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Cytoscreeners",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Data Structures",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Database Design I",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Database Design II",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Dental Assisting",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Desktop Pub & Presentation",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Digital Communication Design",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Digital Marketing",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Digital Photog&Anima for Advt",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Digital Photography",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Digital Voice Transcription",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Disaster Management",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Discrete Mathematics",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Dress Making & Design",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Early Childhood Care & Ed Cert",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Electrical Installation",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Electronic Commerce",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Emergency Care Management",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Entrepreneurship",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Epidemiology",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Essential Skills for the Wrkpl",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Ethics in Journalism and PR",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Event Management",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Event Planning",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Events Management",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Events Photography",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Family & Community Studies",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Film and Video Production",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Food Inspection",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Food Prep & Culinary Arts",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Food Quality Assurance",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Foreign Lang Gen. Proficiency",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Fundamentals of Reporting",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Fundamentals of Selling",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - General Maintenance Fitter",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Geographic Information Systems",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - German Level 1",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Graphic Design",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Graphic Design - Computer Art",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Health Care Administration",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Health Fitness Safety in ECCE",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Health Info. Systems Mgmt.",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Health Records Science",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Health Science Degree Access",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Health Science Foundation",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Henna/Mehndi Design",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Home, School and Community Dev",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Human & Comp Interface Design",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Human Resource Fundamentals",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Human Resource Management",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Image Manipulation",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Image, Etiquette & Protocol",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Industrial Instrumentation",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Industrial Maintenance",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Industrial Relations",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Infirmary Care",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Info Systems Project Mgmt",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Inst Tech PreSchool Teachers",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Intro Mass Communication",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Intro to Access Databases",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Intro to Computer Hardware",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Intro to Criminal Justice",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Intro to Dev'tal Disabilities",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Intro to Drawing and Painting",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Intro to LatinAmerican Studies",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Intro to Microsoft Access",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Intro to Motion Graphics",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Intro to Networks",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Intro to Photojournalism",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Intro to Project Management",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Intro to Sign Language",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Intro to Strategic PR",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Intro to Supervisory Mgmt",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Intro to Video Production",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Intro to Web Page Design",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Introduction to Film",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Introduction to Graphic Design",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Introduction to Mechanics",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Introduction to Procurement",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Introduction to Programming",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Introduction to Records Mgmt",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Introduction to Spanish",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Jewelry",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Jewelry Making and Design",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Journalism",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Journalism (Cert)",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Machine Shop",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Machine Tool Technology",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Makeup Artistry",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Management with Accounting",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Marketing",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Math for Elem School Teachers",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Mathematical Modelling",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Maths for Elem School Teachers",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Mechanical Engineering",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Microsoft Access-Advanced",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Microsoft Outlook",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Microsoft Teams",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Minute Taking",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Music",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Music Performance",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Nail Art",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Nail Art and Makeup",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Object Oriented Programming I",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Object Oriented Programming II",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Occupational Safety and Health",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Office Communication Mgmt",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Offset Printing & Plate Making",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Oral Presentation Skills",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Org and Mgmt of an ECCE Centre",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Organizational Behaviour",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - OSH Risk Assessment in COVID",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Peer Counseling",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Personal and Business Taxation",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Pharmacy Assistant",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Phlebotomy",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Photography and Video",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Photoshop for Photographers",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Plumbing",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Port Health",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Pre-Medical Studies",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Principles of Design",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Process Plant Operations",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Productivity Tools",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Programming with Java",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Psychology & Counselling",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Public Relations",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Public Sector Management Cert",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Records Management",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Records Mgmt, Public Sector",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Script Writing I",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Script Writing II",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Shorthand",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Sign Language",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Single Camera Production",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - SME Diversification in COVID",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Social Media Communications",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Social Media Literacy",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Spanish for Communication II",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Spanish I",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Spanish Level 1",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Speech Writing",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Substance Abuse",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Supervisory Management - Cert.",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Supervisory Mgmt - Level 1",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Survey of Art History",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Systems Analysis and Design",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Tailoring",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Teacher Training",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Teaching Information Tech",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Telecommunications",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - The Entrepreneurial Mindset",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Tour Guiding",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Typing",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Typing and Shorthand",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Typography I",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Und Culture, Comm  & Conflict",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Underst Human Communication",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Underst Young Children's Beh",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Vector Control",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Vector Graphics",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Video and Film Editing 1",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Vis & Perf Arts for Early Chil",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Vis Thinking & Advert Concepts",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Voice and Presentation",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Welding",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CERT - Word Processing",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "CONT-ED - Continuing Education",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Accounting",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Advertising and Promotions",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Business Management",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Civil Engineering",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Construction",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Echocardiography",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Elec/Electronics Engineering",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Executive Secretary",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Film and Video Production",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Food Inspection",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Home Economics",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Indust Instr Engineering",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Industrial Instrumentation",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Library Technician",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Management Studies",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Mechanical Engineering",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Medical Laboratory Technology",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Printing",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Process Plant Operator",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Public Health Inspection",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Science Technician",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Supervisory Management",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Teaching Information Tech",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "DIPL - Telecommunications Engr",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "ESL - English as a Second Language",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "GCERT - Diabetes Educator",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "GDIP - Do Not Use",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "GDIP - Ultrasound",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "HDIP - Computer Studies",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "NONDEG - Special - Non Degree",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "PGC - Magnetic Resonance Imaging",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "PGC - Online Teaching and Learning",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "PGC - Train the Trainer for Educ",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "PGD - Forensic Investigation and Aud",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "PGD - Health Visiting",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "PGD - International Trade & Commerce",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "PREREQ - Prerequisite Checking",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "TSP - Transitional Studies",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "WKSP - Advanced Makeup Artistry",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "WKSP - COVID-19 Compliance&Readiness",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "WKSP - Customer Service Fundamentals",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "WKSP - FirstAid and CPR Certification",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "WKSP - Fundamentals of Import&Export",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "WKSP - Image, Etiquette & Protocol",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "WKSP - Image/EQ/PROT/Oral Pres",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "WKSP - Import and Export Management",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "WKSP - Interviewing Skills Social Ser",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "WKSP - Managing Self-Care",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "WKSP - Mgmt Skills for Admin Prof'als",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "WKSP - Minute Taking",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "WKSP - Principles of Management",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "programme": "WKSP - Social Media for Adults",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  }
];

export const courseAdvisorOptions: CourseAdvisorOption[] = [
  {
    "courseCode": "ACCT 126",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ACCT 204",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ACCT 210",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ACCT 215",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ACCT 216",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ACCT 222",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ACCT 230",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ACCT 250",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ACCT 310",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ACCT 410",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ACCT 415",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ACCT 420",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ACCT 430",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ADMN 300",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ADVT 230",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "ADVT 240",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "ADVT 241",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "ADVT 244",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "ADVT 330",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "ANTH 250",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "ARTS 120",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "BECO 101",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "courseCode": "BECO 102",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 109",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 113",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 114",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 119",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 121",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 122",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 171",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 172",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 173",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 174",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 176",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 198",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 221",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 231",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 241",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 242",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 244",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 256",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 276",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 281",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 291",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 371",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 378",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 420",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 426",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 433",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 455",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 465",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 473",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 478",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 90",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BIOL 92",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "BLANK",
    "advisorName": "BLANK",
    "advisorEmail": "registrar@costaatt.edu.tt"
  },
  {
    "courseCode": "BUSI 203",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "CATR 122",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "courseCode": "CATR 221",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "courseCode": "CATR 222",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "courseCode": "CATR 266",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "courseCode": "CCNA 120",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "CCNA 122",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "CHEM 121",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "CHEM 131",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "CHEM 132",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "CHEM 204",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "CHEM 205",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "CHEM 208",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "CHEM 215",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "CHEM 216",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "CHEM 90",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "CHEM 92",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "COMM 100",
    "advisorName": "Lalitia Ramlal Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "courseCode": "COMM 104",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "COMM 108",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "COMM 118",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "COMM 119",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "COMM 120",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "COMM 121",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "COMM 123",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "COMM 130",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "COMM 135",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "COMM 140",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "COMM 151",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "COMM 351",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "COMM 365",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "COMM 450",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "COMM 452",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "COMM 455",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "COMM 462",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "COMM 499",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "CORR 127",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "CORR 210",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "CORR 220",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "CORR 310",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "CORR 415",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "COTR 141",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "courseCode": "COTR 266",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "courseCode": "COUN 100",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "CRIM 125",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "CRIM 160",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "CRIM 200",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "CRIM 230",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "CRIM 240",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "CRIM 320",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "CRIM 360",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "CRIM 430",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "CRIM 480",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "DHVI 405",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "DHVI 415",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "DHVI 420",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "DHVI 435",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "DHVI 450",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "DHVI 505",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "DHVI 515",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "DHVI 525",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "DHVI 530",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "DHVI 545",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "DHVI 550",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "ECCE 120",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "ECCE 125",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "ECCE 130",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "ECCE 135",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "ECCE 140",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "ECCE 145",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "ECCE 150",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "ECCE 200",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "ECCE 202",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "ECCE 204",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "ECCE 205",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "ECCE 207",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "ECCE 210",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "ECCE 215",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "ECCE 240",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "ECCE 302",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "ECCE 352",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "ECCE 450",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "ECCE 480",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "ECCE 482",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "ECON 110",
    "advisorName": "Antoinette Stewart-Ache",
    "advisorEmail": "asasche@costaatt.edu.tt"
  },
  {
    "courseCode": "ECON 120",
    "advisorName": "Antoinette Stewart-Ache",
    "advisorEmail": "asasche@costaatt.edu.tt"
  },
  {
    "courseCode": "ECON 125",
    "advisorName": "Antoinette Stewart-Ache",
    "advisorEmail": "asasche@costaatt.edu.tt"
  },
  {
    "courseCode": "ECON 405",
    "advisorName": "Antoinette Stewart-Ache",
    "advisorEmail": "asasche@costaatt.edu.tt"
  },
  {
    "courseCode": "EDUC 124",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "EDUC 300",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "EDUC 305",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "EDUC 310",
    "advisorName": "Shinelle Smith",
    "advisorEmail": "ssmith@costaatt.edu.tt"
  },
  {
    "courseCode": "EMCR 121",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "courseCode": "ENGL 121",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "ENGL 200",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "ENTP 205",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ENTP 210",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ENTP 215",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ENTP 220",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ENTP 306",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ENTP 310",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ENTP 320",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ENTP 375",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ENTP 377",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ENTP 410",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ENTP 420",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ENTP 499",
    "advisorName": "Jerome Khan",
    "advisorEmail": "jkhan@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 102",
    "advisorName": "Sochan Laltoo",
    "advisorEmail": "SLaltoo@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 122",
    "advisorName": "Sochan Laltoo",
    "advisorEmail": "SLaltoo@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 124",
    "advisorName": "Sochan Laltoo",
    "advisorEmail": "SLaltoo@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 136",
    "advisorName": "Sochan Laltoo",
    "advisorEmail": "SLaltoo@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 211",
    "advisorName": "Sochan Laltoo",
    "advisorEmail": "SLaltoo@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 212",
    "advisorName": "Sochan Laltoo",
    "advisorEmail": "SLaltoo@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 213",
    "advisorName": "Sochan Laltoo",
    "advisorEmail": "SLaltoo@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 220",
    "advisorName": "Sochan Laltoo",
    "advisorEmail": "SLaltoo@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 221",
    "advisorName": "Sochan Laltoo",
    "advisorEmail": "SLaltoo@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 223",
    "advisorName": "Sochan Laltoo",
    "advisorEmail": "SLaltoo@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 266",
    "advisorName": "Sochan Laltoo",
    "advisorEmail": "SLaltoo@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 310",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 314",
    "advisorName": "Sochan Laltoo",
    "advisorEmail": "SLaltoo@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 316",
    "advisorName": "Sochan Laltoo",
    "advisorEmail": "SLaltoo@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 321",
    "advisorName": "Sochan Laltoo",
    "advisorEmail": "SLaltoo@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 322",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 324",
    "advisorName": "Sochan Laltoo",
    "advisorEmail": "SLaltoo@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 325",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 330",
    "advisorName": "Sochan Laltoo",
    "advisorEmail": "SLaltoo@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 334",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 400",
    "advisorName": "Sochan Laltoo",
    "advisorEmail": "SLaltoo@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 420",
    "advisorName": "Sochan Laltoo",
    "advisorEmail": "SLaltoo@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 422",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVH 440",
    "advisorName": "Sochan Laltoo",
    "advisorEmail": "SLaltoo@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVS 121",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVS 215",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVS 241",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVS 256",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVS 257",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVS 260",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVS 263",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVS 270",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVS 310",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVS 413",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVS 415",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVS 420",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVS 460",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVS 462",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVS 465",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "ENVS 499",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "EPIE 300",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "courseCode": "FILM 121",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "FILM 140",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "FILM 150",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "FILM 161",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "FILM 251",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "FILM 261",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "FILM 262",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "FILM 271",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "FILM 331",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "FILM 374",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "FILM 432",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "FILM 443",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "FILM 498",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "FINC 205",
    "advisorName": "Antoinette Stewart-Ache",
    "advisorEmail": "asasche@costaatt.edu.tt"
  },
  {
    "courseCode": "FINC 310",
    "advisorName": "Antoinette Stewart-Ache",
    "advisorEmail": "asasche@costaatt.edu.tt"
  },
  {
    "courseCode": "FYEC 100",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "RMahase@costaatt.edu.tt"
  },
  {
    "courseCode": "GEOG 121",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "GISY 172",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "GRDE 122",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "GRDE 123",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "GRDE 124",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "GRDE 129",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "GRDE 130",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "GRDE 153",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "GRDE 182",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "GRDE 215",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "GRDE 225",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "GRDE 230",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "GRDE 233",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "GRDE 234",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "GRDE 245",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "GRDE 253",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "GRDE 255",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "GRDE 353",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "GRDE 363",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "GRDE 419",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "GRDE 440",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "GRDE 442",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "GRDE 453",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "GRDE 499",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "HIST 210",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "HLED 100",
    "advisorName": "Sochan Laltoo",
    "advisorEmail": "SLaltoo@costaatt.edu.tt"
  },
  {
    "courseCode": "HLED 110",
    "advisorName": "Sochan Laltoo",
    "advisorEmail": "SLaltoo@costaatt.edu.tt"
  },
  {
    "courseCode": "HLED 320",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "HLED 410",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "HSHP 500",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "courseCode": "HSSE 101",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "courseCode": "HURM 117",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "HURM 310",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "HURM 315",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "HURM 320",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "HURM 333",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "HURM 334",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "HURM 400",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "HURM 410",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "HURM 420",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "HURM 430",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "HURM 450",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 115",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 120",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 121",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 122",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 124",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 129",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 133",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 140",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 225",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 228",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 229",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 235",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 236",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 240",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 243",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 244",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 245",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 250",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 251",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 260",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 269",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 270",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 285",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 291",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 292",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 322",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 325",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 342",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 351",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 352",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 360",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 363",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 371",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 372",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 376",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 443",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 444",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 451",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 452",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 453",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 455",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 456",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 457",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 474",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 476",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 499",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "ITEC 98",
    "advisorName": "Roger Chung",
    "advisorEmail": "RChung@costaatt.edu.tt"
  },
  {
    "courseCode": "JOUR 123",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "JOUR 131",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "JOUR 135",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "JOUR 244",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "JOUR 275",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "JOUR 281",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "JOUR 298",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "JOUR 305",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "JOUR 340",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "JOUR 354",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "JOUR 360",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "JOUR 444",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "JOUR 460",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "JOUR 498",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "LANG 95",
    "advisorName": "Louann Hospedales",
    "advisorEmail": "lhospedales@costaatt.edu.tt"
  },
  {
    "courseCode": "LANG 96",
    "advisorName": "Louann Hospedales",
    "advisorEmail": "lhospedales@costaatt.edu.tt"
  },
  {
    "courseCode": "LANG 97",
    "advisorName": "Louann Hospedales",
    "advisorEmail": "lhospedales@costaatt.edu.tt"
  },
  {
    "courseCode": "LANG 98",
    "advisorName": "Louann Hospedales",
    "advisorEmail": "lhospedales@costaatt.edu.tt"
  },
  {
    "courseCode": "LAST 120",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "LAWW 115",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "LAWW 125",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "LAWW 130",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "LAWW 135",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "LAWW 140",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "LAWW 270",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "LAWW 305",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "LAWW 310",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "LAWW 320",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "LIBS 130",
    "advisorName": "Adrian Andrews",
    "advisorEmail": "AAndrews@costaatt.edu.tt"
  },
  {
    "courseCode": "LIBS 135",
    "advisorName": "Adrian Andrews",
    "advisorEmail": "AAndrews@costaatt.edu.tt"
  },
  {
    "courseCode": "LIBS 136",
    "advisorName": "Adrian Andrews",
    "advisorEmail": "AAndrews@costaatt.edu.tt"
  },
  {
    "courseCode": "LIBS 140",
    "advisorName": "Adrian Andrews",
    "advisorEmail": "AAndrews@costaatt.edu.tt"
  },
  {
    "courseCode": "LIBS 145",
    "advisorName": "Adrian Andrews",
    "advisorEmail": "AAndrews@costaatt.edu.tt"
  },
  {
    "courseCode": "LIBS 200",
    "advisorName": "Adrian Andrews",
    "advisorEmail": "AAndrews@costaatt.edu.tt"
  },
  {
    "courseCode": "LIBS 244",
    "advisorName": "Adrian Andrews",
    "advisorEmail": "AAndrews@costaatt.edu.tt"
  },
  {
    "courseCode": "LIBS 273",
    "advisorName": "Adrian Andrews",
    "advisorEmail": "AAndrews@costaatt.edu.tt"
  },
  {
    "courseCode": "LIBS 274",
    "advisorName": "Adrian Andrews",
    "advisorEmail": "AAndrews@costaatt.edu.tt"
  },
  {
    "courseCode": "LIBS 300",
    "advisorName": "Adrian Andrews",
    "advisorEmail": "AAndrews@costaatt.edu.tt"
  },
  {
    "courseCode": "LIBS 372",
    "advisorName": "Adrian Andrews",
    "advisorEmail": "AAndrews@costaatt.edu.tt"
  },
  {
    "courseCode": "LIBS 379",
    "advisorName": "Adrian Andrews",
    "advisorEmail": "AAndrews@costaatt.edu.tt"
  },
  {
    "courseCode": "LIBS 433",
    "advisorName": "Adrian Andrews",
    "advisorEmail": "AAndrews@costaatt.edu.tt"
  },
  {
    "courseCode": "LIBS 477",
    "advisorName": "Adrian Andrews",
    "advisorEmail": "AAndrews@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 108",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 116",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 117",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 118",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 119",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 121",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 143",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 147",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 151",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 160",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 235",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 260",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 261",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 330",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 347",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 355",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 360",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 450",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 461",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 475",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 476",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 91",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 92",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MATH 93",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 120",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 121",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 125",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 134",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 235",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 297",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 298",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 299",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 329",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 340",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 341",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 344",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 345",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 346",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 350",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 353",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 360",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 371",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 397",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 411",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 441",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 444",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 445",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 446",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 452",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 455",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MDLT 499",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "MGMT 105",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MGMT 108",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MGMT 125",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MGMT 200",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MGMT 205",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MGMT 210",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MGMT 300",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MGMT 310",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MGMT 333",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MGMT 345",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MGMT 410",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MGMT 415",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MGMT 420",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MHVI 410",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "MHVI 510",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "MIDC 101",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "MIDC 102",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "MIDC 103",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "MIDC 104",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "MIDC 105",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "MIDC 106",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "MIDC 107",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "MIDC 108",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "MIDC 109",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "MIDW 101",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "MIDW 201",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "MIDW 202",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "MIDW 203",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "MIDW 301",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "MIDW 302",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "MIDW 303",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "MIDW 401",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "MIDW 402",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "MIDW 403",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "MIDW 404",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "MKTG 125",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MKTG 205",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MKTG 212",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MKTG 290",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MKTG 300",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MKTG 320",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MKTG 325",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MKTG 330",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MKTG 340",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MKTG 405",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MKTG 450",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MKTG 455",
    "advisorName": "Sarah Awai",
    "advisorEmail": "sawai-king@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSB 320",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSC 120",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSC 155",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSC 156",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSC 157",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSC 158",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSC 185",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSC 294",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSC 312",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSC 315",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSC 329",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSC 499",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSD 131",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSG 121",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSG 132",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSG 313",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSG 320",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSJ 151",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSJ 152",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSJ 263",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSJ 264",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSJ 485",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSJ 486",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSP 121",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSP 122",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSP 131",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSP 132",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSP 253",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSP 254",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSP 320",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSP 455",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSS 131",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSS 132",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSS 304",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSS 305",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSS 320",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSV 121",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSV 122",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSV 131",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSV 132",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSV 151",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSV 152",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSV 253",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSV 263",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSV 264",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSV 320",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSV 485",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSV 486",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "MUSW 320",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 115",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 116",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 141",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 150",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 156",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 165",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 181",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 201",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 211",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 220",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 223",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 250",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 260",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 261",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 275",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 276",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 301",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 306",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 312",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 320",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 324",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 325",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 326",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 334",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 336",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 337",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 372",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 373",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 382",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 383",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 401",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 411",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 441",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 445",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 447",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 448",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "NURS 499",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "nursingdepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "OSHE 122",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "OSHE 123",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "OSHE 141",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "OSHE 160",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "OSHE 202",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "OSHE 215",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "OSHE 231",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "OSHE 235",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "OSHE 241",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "OSHE 244",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "OSHE 260",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "OSHE 290",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "OSHE 298",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "OSHE 306",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "OSHE 345",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "OSHE 380",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "OSHE 398",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "OSHE 400",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "OSHE 403",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "OSHE 406",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "OSHE 409",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "OSHE 412",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "OSHE 415",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "PCAD 80",
    "advisorName": "Nursing",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "PCAP 70",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "PCAP 71",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "PCAP 72",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "PCAP 73",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "PCAP 74",
    "advisorName": "Jesinta Tobas",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "PCAP 75",
    "advisorName": "Nursing",
    "advisorEmail": "NursingDepartment@costaatt.edu.tt"
  },
  {
    "courseCode": "PHAR 110",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "PHAR 113",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "PHAR 121",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "PHAR 123",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "PHAR 133",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "PHAR 138",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "PHLB 101",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "PHLB 102",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "PHLB 103",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "PHLB 104",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "PHLB 105",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "PHLB 106",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "PHYS 100",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "PHYS 102",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "PHYS 121",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "PHYS 122",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "PHYS 90",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "PHYS 92",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "POLC 127",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "POLC 210",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "POLC 300",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "POLC 320",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "POLC 340",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "POLC 410",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "POLC 420",
    "advisorName": "Kirwin Pyle-Williams",
    "advisorEmail": "kking@costaatt.edu.tt"
  },
  {
    "courseCode": "PORT 150",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 103",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 106",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 122",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 205",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 212",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 220",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 230",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 233",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 243",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 250",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 261",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 325",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 350",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 360",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 365",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 370",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 380",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 410",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 425",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 433",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 435",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 445",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 448",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 462",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 468",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 498",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PSYC 499",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "PUBR 139",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "PUBR 221",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "PUBR 351",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 101",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 222",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 245",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 246",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 253",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 254",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 261",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 275",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 312",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 313",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 318",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 343",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 344",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 351",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 353",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 354",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 364",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 371",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 441",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 455",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 465",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 466",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 471",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 481",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 482",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 483",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RADG 486",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "RCMT 152",
    "advisorName": "Antoinette Stewart-Ache",
    "advisorEmail": "asasche@costaatt.edu.tt"
  },
  {
    "courseCode": "RCMT 153",
    "advisorName": "Antoinette Stewart-Ache",
    "advisorEmail": "asasche@costaatt.edu.tt"
  },
  {
    "courseCode": "RCMT 154",
    "advisorName": "Antoinette Stewart-Ache",
    "advisorEmail": "asasche@costaatt.edu.tt"
  },
  {
    "courseCode": "RCMT 190",
    "advisorName": "Antoinette Stewart-Ache",
    "advisorEmail": "asasche@costaatt.edu.tt"
  },
  {
    "courseCode": "RELI 205",
    "advisorName": "Nadine Gonzales",
    "advisorEmail": "cjack@costaatt.edu.tt"
  },
  {
    "courseCode": "RESR 550",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "SCIE 121",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "SCIE 199",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "SCIE 201",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "SCIE 299",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "SCIE 399",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "SCIE 499",
    "advisorName": "Risha Kalloo",
    "advisorEmail": "RKalloo@costaatt.edu.tt"
  },
  {
    "courseCode": "SDEV 10",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOBE 103",
    "advisorName": "Lalita Ramlal-Chirkoot",
    "advisorEmail": "lrchirkoot@costaatt.edu.tt"
  },
  {
    "courseCode": "SOBE 135",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOBE 247",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOBE 300",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOBE 335",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOBE 375",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOBE 384",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOCI 102",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOCI 215",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOCI 250",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOWK 116",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOWK 122",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOWK 124",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOWK 218",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOWK 234",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOWK 236",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOWK 245",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOWK 248",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOWK 255",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOWK 319",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOWK 321",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOWK 323",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOWK 326",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOWK 355",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOWK 357",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOWK 426",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SOWK 455",
    "advisorName": "Nneka St Rose",
    "advisorEmail": "NSRose@costaatt.edu.tt"
  },
  {
    "courseCode": "SPAN 100",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "SPAN 105",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "SPAN 107",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "SPAN 108",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "SPAN 121",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "SPAN 231",
    "advisorName": "Sophia Edwards Knox",
    "advisorEmail": "SEdwards@costaatt.edu.tt"
  },
  {
    "courseCode": "STAT 120",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "STAT 200",
    "advisorName": "Parvati Ramdial Sookan",
    "advisorEmail": "pramdial-sookan@costaatt.edu.tt"
  },
  {
    "courseCode": "SUST 121",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "USUS 501",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "USUS 502",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "USUS 503",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "USUS 504",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "USUS 505",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "USUS 506",
    "advisorName": "Health Science Technologies",
    "advisorEmail": "healthscitechnologies@costaatt.edu.tt"
  },
  {
    "courseCode": "WRIT 117",
    "advisorName": "Louann Hospedales",
    "advisorEmail": "lhospedales@costaatt.edu.tt"
  },
  {
    "courseCode": "WRMT 200",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "WRMT 286",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "WRMT 290",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "WRMT 317",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "WRMT 427",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  },
  {
    "courseCode": "WRMT 432",
    "advisorName": "Karen Paul",
    "advisorEmail": "KPaul@costaatt.edu.tt"
  }
];

export function findAdvisorForProgramme(programme: string) {
  return programmeOptions.find((option) => option.programme === programme);
}

export function findAdvisorForCourse(course: Pick<CourseLine, "courseCode">) {
  return courseAdvisorOptions.find((option) => option.courseCode === course.courseCode);
}

export function lookupCourseByCrnOrCode(value: string) {
  const needle = value.trim().toLowerCase();
  if (!needle) return undefined;
  return courseAdvisorOptions.find((option) => {
    return option.courseCode.toLowerCase() === needle || option.crn?.toLowerCase() === needle;
  });
}
