import { createServerClient } from "@/lib/supabase/client";
import type {
  EmailTemplate,
  TemplatesListResponse,
  CreateTemplateRequest,
  UpdateTemplateRequest,
} from "./types";

export class TemplateManager {
  private supabase = createServerClient();

  async listTemplates(): Promise<TemplatesListResponse> {
    const { data, error, count } = await this.supabase
      .from("email_templates")
      .select("*", { count: "exact" })
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list templates: ${error.message}`);
    }

    return {
      templates: data as EmailTemplate[],
      total: count ?? 0,
    };
  }

  async getTemplate(id: string): Promise<EmailTemplate | null> {
    const { data, error } = await this.supabase
      .from("email_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to get template: ${error.message}`);
    }

    return data as EmailTemplate;
  }

  async getDefaultTemplate(): Promise<EmailTemplate | null> {
    const { data, error } = await this.supabase
      .from("email_templates")
      .select("*")
      .eq("is_default", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to get default template: ${error.message}`);
    }

    return data as EmailTemplate;
  }

  async getTemplateByName(name: string): Promise<EmailTemplate | null> {
    const { data, error } = await this.supabase
      .from("email_templates")
      .select("*")
      .eq("name", name)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to get template by name: ${error.message}`);
    }

    return data as EmailTemplate;
  }

  async createTemplate(request: CreateTemplateRequest): Promise<EmailTemplate> {
    // If this is being set as default, unset other defaults first
    if (request.is_default) {
      await this.supabase
        .from("email_templates")
        .update({ is_default: false })
        .eq("is_default", true);
    }

    const { data, error } = await this.supabase
      .from("email_templates")
      .insert({
        name: request.name,
        subject: request.subject,
        body: request.body,
        is_default: request.is_default ?? false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }

    return data as EmailTemplate;
  }

  async updateTemplate(
    id: string,
    request: UpdateTemplateRequest
  ): Promise<EmailTemplate> {
    // If this is being set as default, unset other defaults first
    if (request.is_default) {
      await this.supabase
        .from("email_templates")
        .update({ is_default: false })
        .neq("id", id);
    }

    const { data, error } = await this.supabase
      .from("email_templates")
      .update(request)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update template: ${error.message}`);
    }

    return data as EmailTemplate;
  }

  async deleteTemplate(id: string): Promise<void> {
    // Check if it's the default template
    const template = await this.getTemplate(id);
    if (template?.is_default) {
      throw new Error("Cannot delete the default template");
    }

    const { error } = await this.supabase
      .from("email_templates")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete template: ${error.message}`);
    }
  }

  async setAsDefault(id: string): Promise<EmailTemplate> {
    // Unset current default
    await this.supabase
      .from("email_templates")
      .update({ is_default: false })
      .eq("is_default", true);

    // Set new default
    const { data, error } = await this.supabase
      .from("email_templates")
      .update({ is_default: true })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to set default template: ${error.message}`);
    }

    return data as EmailTemplate;
  }
}

export const templateManager = new TemplateManager();
