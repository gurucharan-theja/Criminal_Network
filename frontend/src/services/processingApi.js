import apiClient from "./apiClient";

export const getProcessingJobs = async () => {
  const response = await apiClient.get("/processing");
  return response.data;
};

export const getProcessingJobById = async (id) => {
  const response = await apiClient.get(`/processing/${id}`);
  return response.data;
};

export const getProcessingJobByJobId = async (jobId) => {
  const response = await apiClient.get(
    `/processing/job/${jobId}`
  );

  return response.data;
};

export const getJobsByEvidence = async (evidenceId) => {
  const response = await apiClient.get(
    `/processing/evidence/${evidenceId}`
  );

  return response.data;
};

export const getJobsByStatus = async (status) => {
  const response = await apiClient.get(
    `/processing/status/${status}`
  );

  return response.data;
};

export const createProcessingJob = async (evidenceId) => {
  const response = await apiClient.post(
    `/processing/evidence/${evidenceId}`
  );

  return response.data;
};

export const updateProcessingProgress = async (
  id,
  progress,
  currentStage
) => {
  const response = await apiClient.patch(
    `/processing/${id}/progress`,
    {
      progress,
      currentStage,
    }
  );

  return response.data;
};

export const completeProcessingJob = async (id) => {
  const response = await apiClient.patch(
    `/processing/${id}/complete`
  );

  return response.data;
};

export const failProcessingJob = async (id, errorMessage) => {
  const response = await apiClient.patch(
    `/processing/${id}/fail`,
    null,
    {
      params: {
        errorMessage,
      },
    }
  );

  return response.data;
};
export const waitForProcessingJob = async (
  jobId,
  onProgress,
  interval = 500
) => {
  while (true) {
    const job = await getProcessingJobByJobId(jobId);

    if (typeof onProgress === "function") {
      onProgress(job);
    }

    if (
      job.status === "COMPLETED" ||
      job.status === "FAILED"
    ) {
      return job;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, interval)
    );
  }
};