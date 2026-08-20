// Curated skill taxonomy for Data Analyst / Data Engineer / Data Scientist roles.
// Mirrors skills_data.py from the Python version of this project.

const ROLE_SKILLS = {
  "Data Analyst": [
    "SQL", "Excel", "Power BI", "Tableau", "Looker", "Google Sheets",
    "Python", "R", "Statistics", "A/B Testing", "Data Visualization",
    "Dashboarding", "ETL", "Google Analytics", "Data Cleaning",
    "Pandas", "NumPy", "Hypothesis Testing", "Regression Analysis",
    "KPI Reporting", "Business Intelligence", "Data Storytelling",
    "VBA", "DAX", "Google BigQuery", "Snowflake", "Statistical Analysis",
    "Forecasting", "Data Modeling", "Stakeholder Management",
    "SPSS", "STATA", "MIS Reporting", "Google Data Studio",
  ],
  "Data Engineer": [
    "Python", "SQL", "Apache Spark", "Apache Airflow", "Apache Kafka",
    "ETL", "ELT", "Data Warehousing", "AWS", "Azure", "GCP", "Docker",
    "Kubernetes", "dbt", "Snowflake", "Redshift", "BigQuery",
    "Hadoop", "Scala", "Java", "NoSQL", "PostgreSQL", "MySQL",
    "MongoDB", "Data Modeling", "CI/CD", "Terraform", "Linux",
    "Data Pipeline", "Distributed Systems", "Databricks", "Git",
    "Batch Processing", "Stream Processing", "REST API",
    "Oracle", "SQL Server", "SSIS",
  ],
  "Data Scientist": [
    "Python", "R", "Machine Learning", "Deep Learning", "SQL",
    "Statistics", "Scikit-learn", "TensorFlow", "PyTorch", "Keras",
    "NLP", "Computer Vision", "Pandas", "NumPy", "Data Visualization",
    "A/B Testing", "Hypothesis Testing", "Feature Engineering",
    "Model Deployment", "MLOps", "Regression Analysis",
    "Classification", "Clustering", "Time Series Analysis",
    "Neural Networks", "Big Data", "Spark", "Jupyter",
    "Experiment Design", "Data Mining", "Predictive Modeling",
    "Power BI",
  ],
};

function allSkills() {
  const seen = new Map();
  for (const skills of Object.values(ROLE_SKILLS)) {
    for (const skill of skills) {
      seen.set(skill.toLowerCase(), skill);
    }
  }
  return [...seen.values()];
}

const ALL_SKILLS = allSkills();
